"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CursoRecurso, TipoRecurso } from "@/lib/cursos";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RecursoFormProps {
  cursoId: string;
  recurso: CursoRecurso | null;
  siguienteOrden: number;
  onClose: () => void;
  onSaved: () => void;
}

export function RecursoForm({ cursoId, recurso, siguienteOrden, onClose, onSaved }: RecursoFormProps) {
  const [titulo, setTitulo] = useState(recurso?.titulo ?? "");
  const [tipo, setTipo] = useState<TipoRecurso>(recurso?.tipo ?? "lectura");
  const [url, setUrl] = useState(recurso?.url ?? "");
  const [duracionMin, setDuracionMin] = useState<number | "">(recurso?.duracion_min ?? "");
  const [orden, setOrden] = useState(recurso?.orden ?? siguienteOrden);
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
      curso_id: cursoId,
      titulo: titulo.trim(),
      tipo,
      url: url || null,
      duracion_min: duracionMin === "" ? null : Number(duracionMin),
      orden,
    };

    const { error: saveError } = recurso
      ? await supabase.from("curso_recursos").update(payload).eq("id", recurso.id)
      : await supabase.from("curso_recursos").insert(payload);

    if (saveError) {
      setError(saveError.message);
      setGuardando(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal titulo={recurso ? "Editar recurso" : "Nuevo recurso"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="rc-titulo">Título</Label>
          <Input
            id="rc-titulo"
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="ej: Guía de Porciones PDF"
          />
        </div>

        <div className="grid gap-1.5">
          <Label>Tipo</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as TipoRecurso)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lectura">Lectura sugerida</SelectItem>
              <SelectItem value="descargable">Descargable (PDF, etc.)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="rc-url">Enlace de Google Drive</Label>
          <Input
            id="rc-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/…/view"
          />
          <p className="text-xs text-muted-foreground">
            El cliente hará clic en &quot;Descargar&quot; o &quot;Leer&quot; y se le redirigirá a este enlace.
            Comparte el archivo de Drive como &quot;Cualquier persona con el enlace&quot;.
          </p>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="rc-duracion">
            {tipo === "lectura" ? "Minutos de lectura" : "Duración (opcional)"}
          </Label>
          <Input
            id="rc-duracion"
            type="number"
            value={duracionMin}
            onChange={(e) => setDuracionMin(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="rc-orden">Orden</Label>
          <Input id="rc-orden" type="number" value={orden} onChange={(e) => setOrden(Number(e.target.value))} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={guardando} className="w-fit">
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </Modal>
  );
}
