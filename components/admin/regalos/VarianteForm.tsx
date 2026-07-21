"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { RegaloVariante } from "@/lib/regalo-variantes";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VarianteFormProps {
  regaloId: string;
  variante: RegaloVariante | null;
  siguienteOrden: number;
  onClose: () => void;
  onSaved: () => void;
}

function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function VarianteForm({ regaloId, variante, siguienteOrden, onClose, onSaved }: VarianteFormProps) {
  const [nombre, setNombre] = useState(variante?.nombre ?? "");
  const [imagen, setImagen] = useState<string | null>(variante?.imagen ?? null);
  const [activo, setActivo] = useState(variante?.activo ?? true);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subirImagen(file: File) {
    setSubiendo(true);
    const supabase = createClient();
    const path = `regalos/variantes/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("productos-web-fotos")
      .upload(path, file);
    if (!uploadError) {
      const { data } = supabase.storage.from("productos-web-fotos").getPublicUrl(path);
      setImagen(data.publicUrl);
    }
    setSubiendo(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setGuardando(true);
    setError(null);

    const supabase = createClient();
    const payload = {
      regalo_id: regaloId,
      nombre: nombre.trim(),
      imagen,
      activo,
      orden: variante?.orden ?? siguienteOrden,
      ...(variante ? {} : { slug: slugify(nombre) }),
    };

    const { error: saveError } = variante
      ? await supabase.from("regalo_variantes").update(payload).eq("id", variante.id)
      : await supabase.from("regalo_variantes").insert(payload);

    if (saveError) {
      setError(saveError.message);
      setGuardando(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal titulo={variante ? "Editar variante" : "Nueva variante"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="v-nombre">Nombre</Label>
          <Input
            id="v-nombre"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="ej: Piña"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="v-imagen">Imagen</Label>
          <Input
            id="v-imagen"
            type="file"
            accept="image/*"
            disabled={subiendo}
            onChange={(e) => e.target.files?.[0] && subirImagen(e.target.files[0])}
          />
          {imagen && (
            <div className="relative h-16 w-16 overflow-hidden rounded-lg border">
              <Image src={imagen} alt="" fill className="object-cover" sizes="64px" />
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={activo} onCheckedChange={(checked) => setActivo(checked === true)} />
          Activo
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={guardando || subiendo} className="w-fit">
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </Modal>
  );
}
