"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/admin/Modal";

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
        <div>
          <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
            Nombre
          </label>
          <input
            required
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
            Descripción
          </label>
          <textarea
            rows={2}
            value={form.descripcion ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
            Imagen
          </label>
          <input
            type="file"
            accept="image/*"
            disabled={subiendo}
            onChange={(e) => e.target.files?.[0] && subirImagen(e.target.files[0])}
            className="w-full font-body text-sm"
          />
          {form.imagen && (
            <div className="relative mt-2 h-16 w-16 overflow-hidden rounded-lg border border-border">
              <Image src={form.imagen} alt="" fill className="object-cover" sizes="64px" />
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
            Condición
          </label>
          <select
            value={form.condicion_tipo}
            onChange={(e) =>
              setForm((f) => ({ ...f, condicion_tipo: e.target.value as Regalo["condicion_tipo"] }))
            }
            className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm"
          >
            <option value="monto_minimo">Monto mínimo de compra</option>
            <option value="producto_especifico">Compra de un producto específico</option>
          </select>
        </div>

        {form.condicion_tipo === "monto_minimo" ? (
          <div>
            <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
              Monto mínimo (S/.)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.condicion_monto_minimo ?? 0}
              onChange={(e) =>
                setForm((f) => ({ ...f, condicion_monto_minimo: Number(e.target.value) }))
              }
              className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm"
            />
          </div>
        ) : (
          <div>
            <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
              Producto
            </label>
            <select
              value={form.condicion_producto_slug ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, condicion_producto_slug: e.target.value }))}
              className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm"
            >
              <option value="">Selecciona un producto</option>
              {productos.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
              Vigente desde
            </label>
            <input
              type="date"
              value={form.fecha_inicio ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, fecha_inicio: e.target.value || null }))}
              className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
              Vigente hasta
            </label>
            <input
              type="date"
              value={form.fecha_fin ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, fecha_fin: e.target.value || null }))}
              className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 font-body text-sm text-secondary">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
          />
          Activo
        </label>

        {error && <p className="font-body text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={guardando || subiendo}
          className="mt-2 w-fit rounded-full bg-primary px-6 py-2.5 font-body font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </Modal>
  );
}
