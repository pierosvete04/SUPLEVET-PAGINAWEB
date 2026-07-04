"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <div className="grid gap-1.5">
          <Label htmlFor="z-nombre">Nombre de la zona</Label>
          <Input
            id="z-nombre"
            required
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="z-departamentos">Departamentos (separados por coma)</Label>
          <Input
            id="z-departamentos"
            required
            value={departamentosTexto}
            onChange={(e) => setDepartamentosTexto(e.target.value)}
            placeholder="Lima Metropolitana"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="z-tiempo">Tiempo estimado</Label>
          <Input
            id="z-tiempo"
            required
            value={form.tiempo_estimado}
            onChange={(e) => setForm((f) => ({ ...f, tiempo_estimado: e.target.value }))}
            placeholder="24–48 horas hábiles"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="z-costo">Costo de envío (S/.)</Label>
            <Input
              id="z-costo"
              required
              type="number"
              step="0.01"
              value={form.costo_envio}
              onChange={(e) => setForm((f) => ({ ...f, costo_envio: Number(e.target.value) }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="z-gratis">Monto mínimo envío gratis (S/.)</Label>
            <Input
              id="z-gratis"
              required
              type="number"
              step="0.01"
              value={form.monto_minimo_gratis}
              onChange={(e) => setForm((f) => ({ ...f, monto_minimo_gratis: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="z-orden">Orden</Label>
          <Input
            id="z-orden"
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
          Activa
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={guardando} className="w-fit">
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </Modal>
  );
}
