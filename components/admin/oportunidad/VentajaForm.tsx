"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OportunidadVentaja } from "@/lib/oportunidad-ventajas";

interface VentajaFormProps {
  ventaja: OportunidadVentaja | null;
  onClose: () => void;
  onSaved: () => void;
}

// Debe coincidir con el mapa de íconos de app/oportunidad-de-negocio/page.tsx
const ICONOS_DISPONIBLES = [
  "FlaskConical",
  "Sparkles",
  "TrendingUp",
  "Clock",
  "GraduationCap",
  "HeartPulse",
];

const VACIO: Omit<OportunidadVentaja, "id"> = {
  icono: "FlaskConical",
  titulo: "",
  texto: "",
  orden: 0,
  activo: true,
};

export function VentajaForm({ ventaja, onClose, onSaved }: VentajaFormProps) {
  const [form, setForm] = useState<Omit<OportunidadVentaja, "id">>(ventaja ?? VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    const supabase = createClient();

    const { error: saveError } = ventaja
      ? await supabase.from("oportunidad_ventajas").update(form).eq("id", ventaja.id)
      : await supabase.from("oportunidad_ventajas").insert(form);

    if (saveError) {
      setError(saveError.message);
      setGuardando(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal titulo={ventaja ? "Editar ventaja" : "Nueva ventaja"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="ov-titulo">Título</Label>
          <Input
            id="ov-titulo"
            required
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="ov-texto">Texto</Label>
          <Textarea
            id="ov-texto"
            required
            rows={3}
            value={form.texto}
            onChange={(e) => setForm((f) => ({ ...f, texto: e.target.value }))}
          />
        </div>

        <div className="grid gap-1.5">
          <Label>Ícono</Label>
          <Select value={form.icono} onValueChange={(v) => setForm((f) => ({ ...f, icono: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ICONOS_DISPONIBLES.map((icono) => (
                <SelectItem key={icono} value={icono}>
                  {icono}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="ov-orden">Orden</Label>
          <Input
            id="ov-orden"
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

        <Button type="submit" disabled={guardando} className="w-fit">
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </Modal>
  );
}
