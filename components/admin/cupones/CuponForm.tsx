"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/admin/Modal";

export interface Cupon {
  id: string;
  codigo: string;
  tipo: "envio_gratis" | "pct_envio" | "pct_producto" | "monto_fijo_producto";
  valor: number;
  monto_minimo: number;
  usos_actuales: number;
  usos_maximos: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activo: boolean;
}

interface CuponFormProps {
  cupon: Cupon | null;
  onClose: () => void;
  onSaved: () => void;
}

const VACIO: Omit<Cupon, "id"> = {
  codigo: "",
  tipo: "envio_gratis",
  valor: 0,
  monto_minimo: 0,
  usos_actuales: 0,
  usos_maximos: null,
  fecha_inicio: null,
  fecha_fin: null,
  activo: true,
};

const TIPOS: { value: Cupon["tipo"]; label: string }[] = [
  { value: "envio_gratis", label: "Envío gratis" },
  { value: "pct_envio", label: "% de descuento en envío" },
  { value: "pct_producto", label: "% de descuento en producto" },
  { value: "monto_fijo_producto", label: "Monto fijo de descuento en producto" },
];

export function CuponForm({ cupon, onClose, onSaved }: CuponFormProps) {
  const [form, setForm] = useState<Omit<Cupon, "id">>(cupon ?? VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const supabase = createClient();
    const payload = { ...form, codigo: form.codigo.toUpperCase().trim() };
    const { error: saveError } = cupon
      ? await supabase.from("cupones").update(payload).eq("id", cupon.id)
      : await supabase.from("cupones").insert(payload);

    if (saveError) {
      setError(saveError.message);
      setGuardando(false);
      return;
    }
    onSaved();
  }

  const requiereValor = form.tipo !== "envio_gratis";

  return (
    <Modal titulo={cupon ? "Editar cupón" : "Nuevo cupón"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
              Código
            </label>
            <input
              required
              value={form.codigo}
              onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
              className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm uppercase"
            />
          </div>
          <div>
            <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
              Tipo de descuento
            </label>
            <select
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as Cupon["tipo"] }))}
              className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {requiereValor && (
            <div>
              <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
                Valor {form.tipo.startsWith("pct") ? "(%)" : "(S/.)"}
              </label>
              <input
                type="number"
                step="0.01"
                value={form.valor}
                onChange={(e) => setForm((f) => ({ ...f, valor: Number(e.target.value) }))}
                className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
              Monto mínimo de compra (S/.)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.monto_minimo}
              onChange={(e) => setForm((f) => ({ ...f, monto_minimo: Number(e.target.value) }))}
              className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
              Usos máximos
            </label>
            <input
              type="number"
              value={form.usos_maximos ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  usos_maximos: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              placeholder="Ilimitado"
              className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm"
            />
          </div>
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
          disabled={guardando}
          className="mt-2 w-fit rounded-full bg-primary px-6 py-2.5 font-body font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </Modal>
  );
}
