"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/admin/Modal";
import type { EnvioZona } from "@/lib/shipping";

interface ZonaFormProps {
  zona: EnvioZona | null;
  onClose: () => void;
  onSaved: () => void;
}

const VACIO: Omit<EnvioZona, "id"> = {
  nombre: "",
  departamentos: [],
  tiempo_estimado: "",
  monto_minimo_gratis: 0,
  costo_envio: 0,
  orden: 0,
  activo: true,
};

export function ZonaForm({ zona, onClose, onSaved }: ZonaFormProps) {
  const [form, setForm] = useState<Omit<EnvioZona, "id">>(zona ?? VACIO);
  const [departamentosTexto, setDepartamentosTexto] = useState(
    (zona?.departamentos ?? []).join(", ")
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const payload = {
      ...form,
      departamentos: departamentosTexto
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean),
    };

    const supabase = createClient();
    const { error: saveError } = zona
      ? await supabase.from("envio_zonas").update(payload).eq("id", zona.id)
      : await supabase.from("envio_zonas").insert(payload);

    if (saveError) {
      setError(saveError.message);
      setGuardando(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal titulo={zona ? "Editar zona de envío" : "Nueva zona de envío"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
            Nombre de la zona
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
            Departamentos (separados por coma)
          </label>
          <input
            required
            value={departamentosTexto}
            onChange={(e) => setDepartamentosTexto(e.target.value)}
            placeholder="Lima Metropolitana"
            className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
            Tiempo estimado
          </label>
          <input
            required
            value={form.tiempo_estimado}
            onChange={(e) => setForm((f) => ({ ...f, tiempo_estimado: e.target.value }))}
            placeholder="24–48 horas hábiles"
            className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
              Costo de envío (S/.)
            </label>
            <input
              required
              type="number"
              step="0.01"
              value={form.costo_envio}
              onChange={(e) => setForm((f) => ({ ...f, costo_envio: Number(e.target.value) }))}
              className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
              Monto mínimo envío gratis (S/.)
            </label>
            <input
              required
              type="number"
              step="0.01"
              value={form.monto_minimo_gratis}
              onChange={(e) =>
                setForm((f) => ({ ...f, monto_minimo_gratis: Number(e.target.value) }))
              }
              className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
            Orden
          </label>
          <input
            type="number"
            value={form.orden}
            onChange={(e) => setForm((f) => ({ ...f, orden: Number(e.target.value) }))}
            className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm"
          />
        </div>

        <label className="flex items-center gap-2 font-body text-sm text-secondary">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
          />
          Activa
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
