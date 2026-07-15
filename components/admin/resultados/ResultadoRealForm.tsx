"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ResultadoReal } from "@/lib/resultados-reales";

interface ResultadoRealFormProps {
  resultado: ResultadoReal | null;
  onClose: () => void;
  onSaved: () => void;
}

const VACIO: Omit<ResultadoReal, "id"> = {
  titulo: "",
  semanas: 0,
  foto_antes_url: null,
  foto_despues_url: null,
  orden: 0,
  activo: true,
};

async function subirA(bucketPath: string, file: File): Promise<string | null> {
  const supabase = createClient();
  const path = `${bucketPath}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("productos-web-fotos").upload(path, file);
  if (error) return null;
  return supabase.storage.from("productos-web-fotos").getPublicUrl(path).data.publicUrl;
}

export function ResultadoRealForm({ resultado, onClose, onSaved }: ResultadoRealFormProps) {
  const [form, setForm] = useState<Omit<ResultadoReal, "id">>(resultado ?? VACIO);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAntes(file: File) {
    setSubiendo(true);
    const url = await subirA("resultados-reales/antes", file);
    if (url) setForm((f) => ({ ...f, foto_antes_url: url }));
    setSubiendo(false);
  }

  async function handleDespues(file: File) {
    setSubiendo(true);
    const url = await subirA("resultados-reales/despues", file);
    if (url) setForm((f) => ({ ...f, foto_despues_url: url }));
    setSubiendo(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    const supabase = createClient();

    const { error: saveError } = resultado
      ? await supabase.from("resultados_reales").update(form).eq("id", resultado.id)
      : await supabase.from("resultados_reales").insert(form);

    if (saveError) {
      setError(saveError.message);
      setGuardando(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal titulo={resultado ? "Editar resultado" : "Nuevo resultado"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="r-titulo">Título</Label>
          <Input
            id="r-titulo"
            required
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="r-semanas">Semanas de uso</Label>
          <Input
            id="r-semanas"
            type="number"
            value={form.semanas}
            onChange={(e) => setForm((f) => ({ ...f, semanas: Number(e.target.value) }))}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="r-antes">Foto &quot;Antes&quot;</Label>
            <Input
              id="r-antes"
              type="file"
              accept="image/*"
              disabled={subiendo}
              onChange={(e) => e.target.files?.[0] && handleAntes(e.target.files[0])}
            />
            {form.foto_antes_url && (
              <div className="relative h-32 w-full overflow-hidden rounded-md border">
                <Image src={form.foto_antes_url} alt="" fill className="object-cover" sizes="200px" />
              </div>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="r-despues">Foto &quot;Después&quot;</Label>
            <Input
              id="r-despues"
              type="file"
              accept="image/*"
              disabled={subiendo}
              onChange={(e) => e.target.files?.[0] && handleDespues(e.target.files[0])}
            />
            {form.foto_despues_url && (
              <div className="relative h-32 w-full overflow-hidden rounded-md border">
                <Image src={form.foto_despues_url} alt="" fill className="object-cover" sizes="200px" />
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="r-orden">Orden</Label>
          <Input
            id="r-orden"
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
