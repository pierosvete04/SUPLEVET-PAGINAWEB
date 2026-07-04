"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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

interface ProductoOpcion {
  slug: string;
  nombre: string;
}

export interface Regalo {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
  condicion_tipo: "monto_minimo" | "producto_especifico";
  condicion_monto_minimo: number | null;
  condicion_producto_slug: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activo: boolean;
}

interface RegaloFormProps {
  regalo: Regalo | null;
  onClose: () => void;
  onSaved: () => void;
}

const VACIO: Omit<Regalo, "id"> = {
  nombre: "",
  descripcion: "",
  imagen: null,
  condicion_tipo: "monto_minimo",
  condicion_monto_minimo: 0,
  condicion_producto_slug: null,
  fecha_inicio: null,
  fecha_fin: null,
  activo: true,
};

export function RegaloForm({ regalo, onClose, onSaved }: RegaloFormProps) {
  const [form, setForm] = useState<Omit<Regalo, "id">>(regalo ?? VACIO);
  const [productos, setProductos] = useState<ProductoOpcion[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .from("productos_web")
      .select("slug, nombre")
      .order("orden", { ascending: true })
      .then(({ data }) => setProductos((data as ProductoOpcion[]) ?? []));
  }, []);

  async function subirImagen(file: File) {
    setSubiendo(true);
    const supabase = createClient();
    const path = `regalos/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("productos-web-fotos")
      .upload(path, file);
    if (!uploadError) {
      const { data } = supabase.storage.from("productos-web-fotos").getPublicUrl(path);
      setForm((f) => ({ ...f, imagen: data.publicUrl }));
    }
    setSubiendo(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const supabase = createClient();
    const { error: saveError } = regalo
      ? await supabase.from("regalos").update(form).eq("id", regalo.id)
      : await supabase.from("regalos").insert(form);

    if (saveError) {
      setError(saveError.message);
      setGuardando(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal titulo={regalo ? "Editar regalo" : "Nuevo regalo"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="r-nombre">Nombre</Label>
          <Input
            id="r-nombre"
            required
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="r-descripcion">Descripción</Label>
          <Textarea
            id="r-descripcion"
            rows={2}
            value={form.descripcion ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="r-imagen">Imagen</Label>
          <Input
            id="r-imagen"
            type="file"
            accept="image/*"
            disabled={subiendo}
            onChange={(e) => e.target.files?.[0] && subirImagen(e.target.files[0])}
          />
          {form.imagen && (
            <div className="relative h-16 w-16 overflow-hidden rounded-lg border">
              <Image src={form.imagen} alt="" fill className="object-cover" sizes="64px" />
            </div>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label>Condición</Label>
          <Select
            value={form.condicion_tipo}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, condicion_tipo: v as Regalo["condicion_tipo"] }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monto_minimo">Monto mínimo de compra</SelectItem>
              <SelectItem value="producto_especifico">Compra de un producto específico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {form.condicion_tipo === "monto_minimo" ? (
          <div className="grid gap-1.5">
            <Label htmlFor="r-monto">Monto mínimo (S/.)</Label>
            <Input
              id="r-monto"
              type="number"
              step="0.01"
              value={form.condicion_monto_minimo ?? 0}
              onChange={(e) => setForm((f) => ({ ...f, condicion_monto_minimo: Number(e.target.value) }))}
            />
          </div>
        ) : (
          <div className="grid gap-1.5">
            <Label>Producto</Label>
            <Select
              value={form.condicion_producto_slug ?? undefined}
              onValueChange={(v) => setForm((f) => ({ ...f, condicion_producto_slug: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {productos.map((p) => (
                  <SelectItem key={p.slug} value={p.slug}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="r-desde">Vigente desde</Label>
            <Input
              id="r-desde"
              type="date"
              value={form.fecha_inicio ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, fecha_inicio: e.target.value || null }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="r-hasta">Vigente hasta</Label>
            <Input
              id="r-hasta"
              type="date"
              value={form.fecha_fin ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, fecha_fin: e.target.value || null }))}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.activo}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, activo: checked === true }))}
          />
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
