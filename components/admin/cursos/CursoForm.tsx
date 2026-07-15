"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { Curso } from "@/lib/cursos";

interface CursoFormProps {
  curso: Curso | null;
  onClose: () => void;
  onSaved: () => void;
}

const VACIO: Omit<Curso, "id" | "created_at"> = {
  titulo: "",
  tipo: "video",
  video_url: null,
  contenido: null,
  thumbnail_url: null,
  orden: 0,
  activo: true,
  categoria: null,
  descripcion: null,
  duracion_min: null,
  es_gratis: true,
  nivel: null,
  etiqueta: null,
  puntos_curso: 0,
};

export function CursoForm({ curso, onClose, onSaved }: CursoFormProps) {
  const [form, setForm] = useState<Omit<Curso, "id" | "created_at">>(curso ?? VACIO);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subirMiniatura(file: File) {
    setSubiendo(true);
    const supabase = createClient();
    const path = `cursos/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("cursos-contenido").upload(path, file);
    if (!uploadError) {
      const { data } = supabase.storage.from("cursos-contenido").getPublicUrl(path);
      setForm((f) => ({ ...f, thumbnail_url: data.publicUrl }));
    }
    setSubiendo(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    const supabase = createClient();

    const { error: saveError } = curso
      ? await supabase.from("cursos").update(form).eq("id", curso.id)
      : await supabase.from("cursos").insert(form);

    if (saveError) {
      setError(saveError.message);
      setGuardando(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal titulo={curso ? "Editar curso" : "Nuevo curso"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="c-titulo">Título</Label>
          <Input
            id="c-titulo"
            required
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
          />
        </div>

        <div className="grid gap-1.5">
          <Label>Tipo</Label>
          <Select
            value={form.tipo}
            onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as Curso["tipo"] }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="articulo">Artículo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {form.tipo === "video" ? (
          <div className="grid gap-1.5">
            <Label htmlFor="c-video">Enlace de Google Drive (opcional, solo si el curso no usa módulos)</Label>
            <Input
              id="c-video"
              type="url"
              value={form.video_url ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value || null }))}
              placeholder="https://drive.google.com/file/d/…/view"
            />
          </div>
        ) : (
          <div className="grid gap-1.5">
            <Label htmlFor="c-contenido">Contenido</Label>
            <Textarea
              id="c-contenido"
              rows={6}
              value={form.contenido ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, contenido: e.target.value }))}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="c-categoria">Categoría</Label>
            <Select
              value={form.categoria ?? ""}
              onValueChange={(v) => setForm((f) => ({ ...f, categoria: v }))}
            >
              <SelectTrigger id="c-categoria">
                <SelectValue placeholder="Selecciona…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nutricion">Nutrición</SelectItem>
                <SelectItem value="comportamiento">Comportamiento</SelectItem>
                <SelectItem value="salud">Salud</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-nivel">Nivel</Label>
            <Select value={form.nivel ?? ""} onValueChange={(v) => setForm((f) => ({ ...f, nivel: v }))}>
              <SelectTrigger id="c-nivel">
                <SelectValue placeholder="Selecciona…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="principiante">Principiante</SelectItem>
                <SelectItem value="intermedio">Intermedio</SelectItem>
                <SelectItem value="avanzado">Avanzado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="c-descripcion">Descripción corta</Label>
          <Textarea
            id="c-descripcion"
            rows={2}
            value={form.descripcion ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="c-duracion">Duración (min)</Label>
            <Input
              id="c-duracion"
              type="number"
              value={form.duracion_min ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, duracion_min: e.target.value ? Number(e.target.value) : null }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-puntos">Puntos al completar</Label>
            <Input
              id="c-puntos"
              type="number"
              value={form.puntos_curso}
              onChange={(e) => setForm((f) => ({ ...f, puntos_curso: Number(e.target.value) }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-etiqueta">Etiqueta (opcional)</Label>
            <Input
              id="c-etiqueta"
              placeholder="Ej: Popular"
              value={form.etiqueta ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, etiqueta: e.target.value }))}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.es_gratis}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, es_gratis: checked === true }))}
          />
          Curso gratuito
        </label>

        <div className="grid gap-1.5">
          <Label htmlFor="c-thumb">Miniatura (opcional)</Label>
          <Input
            id="c-thumb"
            type="file"
            accept="image/*"
            disabled={subiendo}
            onChange={(e) => e.target.files?.[0] && subirMiniatura(e.target.files[0])}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="c-orden">Orden</Label>
          <Input
            id="c-orden"
            type="number"
            value={form.orden}
            onChange={(e) => setForm((f) => ({ ...f, orden: Number(e.target.value) }))}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.activo}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, activo: checked === true }))}
          />
          Activo (visible en el portal)
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={guardando || subiendo} className="w-fit">
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </Modal>
  );
}
