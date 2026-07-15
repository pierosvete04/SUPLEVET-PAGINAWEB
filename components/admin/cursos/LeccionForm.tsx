"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CursoLeccion, TipoCurso } from "@/lib/cursos";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LeccionFormProps {
  moduloId: string;
  leccion: CursoLeccion | null;
  siguienteOrden: number;
  onClose: () => void;
  onSaved: () => void;
}

export function LeccionForm({ moduloId, leccion, siguienteOrden, onClose, onSaved }: LeccionFormProps) {
  const [titulo, setTitulo] = useState(leccion?.titulo ?? "");
  const [tipo, setTipo] = useState<TipoCurso>(leccion?.tipo ?? "video");
  const [videoUrl, setVideoUrl] = useState(leccion?.video_url ?? "");
  const [contenido, setContenido] = useState(leccion?.contenido ?? "");
  const [duracionMin, setDuracionMin] = useState<number | "">(leccion?.duracion_min ?? "");
  const [orden, setOrden] = useState(leccion?.orden ?? siguienteOrden);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    setGuardando(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      modulo_id: moduloId,
      titulo: titulo.trim(),
      tipo,
      video_url: tipo === "video" ? videoUrl || null : null,
      contenido: tipo === "articulo" ? contenido || null : null,
      duracion_min: duracionMin === "" ? null : Number(duracionMin),
      orden,
    };

    const { error: saveError } = leccion
      ? await supabase.from("curso_lecciones").update(payload).eq("id", leccion.id)
      : await supabase.from("curso_lecciones").insert(payload);

    if (saveError) {
      setError(saveError.message);
      setGuardando(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal titulo={leccion ? "Editar lección" : "Nueva lección"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="lc-titulo">Título</Label>
          <Input
            id="lc-titulo"
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="ej: 2. Introducción a la dieta BARF"
          />
        </div>

        <div className="grid gap-1.5">
          <Label>Tipo</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as TipoCurso)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="articulo">Artículo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {tipo === "video" ? (
          <div className="grid gap-1.5">
            <Label htmlFor="lc-video">Enlace de Google Drive</Label>
            <Input
              id="lc-video"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/…/view"
            />
            <p className="text-xs text-muted-foreground">
              El cliente hará clic en la lección y se le redirigirá a este enlace en una pestaña nueva. Recuerda
              compartir el archivo de Drive como &quot;Cualquier persona con el enlace&quot;.
            </p>
          </div>
        ) : (
          <div className="grid gap-1.5">
            <Label htmlFor="lc-contenido">Contenido</Label>
            <Textarea id="lc-contenido" rows={6} value={contenido} onChange={(e) => setContenido(e.target.value)} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="lc-duracion">Duración (min)</Label>
            <Input
              id="lc-duracion"
              type="number"
              value={duracionMin}
              onChange={(e) => setDuracionMin(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="lc-orden">Orden</Label>
            <Input id="lc-orden" type="number" value={orden} onChange={(e) => setOrden(Number(e.target.value))} />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={guardando} className="w-fit">
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </Modal>
  );
}
