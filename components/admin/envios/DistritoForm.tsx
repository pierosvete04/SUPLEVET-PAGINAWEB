"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EnvioDistrito, EnvioZona } from "@/lib/shipping";

interface DistritoFormProps {
  distrito: EnvioDistrito | null;
  zonas: EnvioZona[];
  onClose: () => void;
  onSaved: () => void;
}

export function DistritoForm({ distrito, zonas, onClose, onSaved }: DistritoFormProps) {
  const [form, setForm] = useState<Omit<EnvioDistrito, "id">>(
    distrito ?? {
      zona_id: zonas[0]?.id ?? "",
      distrito: "",
      costo_envio: 0,
      activo: true,
    }
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const supabase = createClient();
    const { error: saveError } = distrito
      ? await supabase.from("envio_distritos").update(form).eq("id", distrito.id)
      : await supabase.from("envio_distritos").insert(form);

    if (saveError) {
      setError(saveError.message);
      setGuardando(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal titulo={distrito ? "Editar tarifa de distrito" : "Nueva tarifa de distrito"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="d-zona">Zona</Label>
          <select
            id="d-zona"
            required
            value={form.zona_id}
            onChange={(e) => setForm((f) => ({ ...f, zona_id: e.target.value }))}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {zonas.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="d-distrito">Distrito</Label>
          <Input
            id="d-distrito"
            required
            value={form.distrito}
            onChange={(e) => setForm((f) => ({ ...f, distrito: e.target.value }))}
            placeholder="Ej. Miraflores"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="d-costo">Costo de envío (S/.)</Label>
          <Input
            id="d-costo"
            required
            type="number"
            step="0.01"
            value={form.costo_envio}
            onChange={(e) => setForm((f) => ({ ...f, costo_envio: Number(e.target.value) }))}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.activo}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, activo: checked === true }))}
          />
          Activo
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={guardando} className="w-fit">
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </Modal>
  );
}
