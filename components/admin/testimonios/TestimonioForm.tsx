"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TestimonioVideo } from "@/lib/testimonios";

interface TestimonioFormProps {
  testimonio: TestimonioVideo | null;
  onClose: () => void;
  onSaved: () => void;
}

const VACIO: Omit<TestimonioVideo, "id"> = {
  titulo: "",
  video_url: "",
  thumbnail_url: null,
  orden: 0,
  activo: true,
};

export function TestimonioForm({ testimonio, onClose, onSaved }: TestimonioFormProps) {
  const [form, setForm] = useState<Omit<TestimonioVideo, "id">>(testimonio ?? VACIO);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subirVideo(file: File) {
    setSubiendo(true);
    const supabase = createClient();
    const path = `testimonios/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("testimonios-videos")
      .upload(path, file);
    if (!uploadError) {
      const { data } = supabase.storage.from("testimonios-videos").getPublicUrl(path);
      setForm((f) => ({ ...f, video_url: data.publicUrl }));
    }
    setSubiendo(false);
  }

  async function subirThumbnail(file: File) {
    setSubiendo(true);
    const supabase = createClient();
    const path = `testimonios/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("testimonios-videos")
      .upload(path, file);
    if (!uploadError) {
      const { data } = supabase.storage.from("testimonios-videos").getPublicUrl(path);
      setForm((f) => ({ ...f, thumbnail_url: data.publicUrl }));
    }
    setSubiendo(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.video_url) {
      setError("El video es obligatorio.");
      return;
    }
    setGuardando(true);
    setError(null);
    const supabase = createClient();

    const { error: saveError } = testimonio
      ? await supabase.from("testimonios_videos").update(form).eq("id", testimonio.id)
      : await supabase.from("testimonios_videos").insert(form);

    if (saveError) {
      setError(saveError.message);
      setGuardando(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal titulo={testimonio ? "Editar testimonio" : "Nuevo testimonio"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="t-titulo">Título</Label>
          <Input
            id="t-titulo"
            required
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="t-video">Video</Label>
          <Input
            id="t-video"
            type="file"
            accept="video/*"
            disabled={subiendo}
            onChange={(e) => e.target.files?.[0] && subirVideo(e.target.files[0])}
          />
          {form.video_url && (
            <video src={form.video_url} className="h-24 w-16 rounded-lg border object-cover" muted />
          )}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="t-thumb">Miniatura (opcional — se genera un frame si no subes una)</Label>
          <Input
            id="t-thumb"
            type="file"
            accept="image/*"
            disabled={subiendo}
            onChange={(e) => e.target.files?.[0] && subirThumbnail(e.target.files[0])}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="t-orden">Orden</Label>
          <Input
            id="t-orden"
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
          Activo (visible en la web)
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={guardando || subiendo} className="w-fit">
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </Modal>
  );
}
