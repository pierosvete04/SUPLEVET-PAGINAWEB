"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface ProductoWeb {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  categoria: "producto" | "combo";
  precio: number;
  precio_comparacion: number;
  imagen: string;
  galeria: string[];
  descuento_porcentaje: number;
  sku: string | null;
  stock: number | null;
  activo: boolean;
  orden: number;
}

interface ProductoFormProps {
  producto: ProductoWeb | null;
  onClose: () => void;
  onSaved: () => void;
}

const VACIO: Omit<ProductoWeb, "id"> = {
  slug: "",
  nombre: "",
  descripcion: "",
  categoria: "producto",
  precio: 0,
  precio_comparacion: 0,
  imagen: "",
  galeria: [],
  descuento_porcentaje: 0,
  sku: "",
  stock: null,
  activo: true,
  orden: 0,
};

export function ProductoForm({ producto, onClose, onSaved }: ProductoFormProps) {
  const [form, setForm] = useState<Omit<ProductoWeb, "id">>(producto ?? VACIO);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subirImagenes(files: FileList) {
    setSubiendo(true);
    const supabase = createClient();
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${form.slug || "sin-slug"}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("productos-web-fotos")
        .upload(path, file);
      if (!uploadError) {
        const { data } = supabase.storage.from("productos-web-fotos").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    setForm((f) => ({
      ...f,
      galeria: [...f.galeria, ...urls],
      imagen: f.imagen || urls[0] || "",
    }));
    setSubiendo(false);
  }

  function quitarImagen(url: string) {
    setForm((f) => ({
      ...f,
      galeria: f.galeria.filter((g) => g !== url),
      imagen: f.imagen === url ? f.galeria.find((g) => g !== url) ?? "" : f.imagen,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.slug || !form.nombre || !form.imagen) {
      setError("Slug, nombre e imagen principal son obligatorios.");
      return;
    }
    setGuardando(true);
    setError(null);
    const supabase = createClient();
    const payload = { ...form, stock: form.stock === null ? null : Number(form.stock) };

    const { error: saveError } = producto
      ? await supabase.from("productos_web").update(payload).eq("id", producto.id)
      : await supabase.from("productos_web").insert(payload);

    if (saveError) {
      setError(saveError.message);
      setGuardando(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal titulo={producto ? "Editar producto" : "Agregar producto"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="p-nombre">Nombre</Label>
            <Input
              id="p-nombre"
              required
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-slug">Slug (URL)</Label>
            <Input
              id="p-slug"
              required
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="p-descripcion">Descripción</Label>
          <Textarea
            id="p-descripcion"
            rows={3}
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label>Categoría</Label>
            <Select
              value={form.categoria}
              onValueChange={(v) => setForm((f) => ({ ...f, categoria: v as "producto" | "combo" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="producto">Producto</SelectItem>
                <SelectItem value="combo">Combo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-sku">SKU</Label>
            <Input
              id="p-sku"
              value={form.sku ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="p-precio">Precio (S/.)</Label>
            <Input
              id="p-precio"
              required
              type="number"
              step="0.01"
              value={form.precio}
              onChange={(e) => setForm((f) => ({ ...f, precio: Number(e.target.value) }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-precio-comp">Precio comparación</Label>
            <Input
              id="p-precio-comp"
              type="number"
              step="0.01"
              value={form.precio_comparacion}
              onChange={(e) => setForm((f) => ({ ...f, precio_comparacion: Number(e.target.value) }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-stock">Stock</Label>
            <Input
              id="p-stock"
              type="number"
              value={form.stock ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, stock: e.target.value === "" ? null : Number(e.target.value) }))
              }
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="p-imagenes">Imágenes</Label>
          <Input
            id="p-imagenes"
            type="file"
            accept="image/*"
            multiple
            disabled={subiendo}
            onChange={(e) => e.target.files && subirImagenes(e.target.files)}
          />
          {subiendo && <p className="text-xs text-muted-foreground">Subiendo…</p>}
          {form.galeria.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.galeria.map((url) => (
                <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg border">
                  <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                  <button
                    type="button"
                    onClick={() => quitarImagen(url)}
                    className="absolute right-0 top-0 rounded-bl bg-black/60 p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {form.imagen === url && (
                    <span className="absolute bottom-0 left-0 right-0 bg-primary/90 text-center text-[9px] font-bold text-white">
                      Principal
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.activo}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, activo: checked === true }))}
          />
          Activo (visible en la tienda)
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={guardando || subiendo} className="w-fit">
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </Modal>
  );
}
