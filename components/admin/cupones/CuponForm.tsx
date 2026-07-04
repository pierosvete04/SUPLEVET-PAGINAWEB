"use client";

import { useState } from "react";
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
          <div className="grid gap-1.5">
            <Label htmlFor="c-codigo">Código</Label>
            <Input
              id="c-codigo"
              required
              value={form.codigo}
              onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
              className="uppercase"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Tipo de descuento</Label>
            <Select
              value={form.tipo}
              onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as Cupon["tipo"] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {requiereValor && (
            <div className="grid gap-1.5">
              <Label htmlFor="c-valor">Valor {form.tipo.startsWith("pct") ? "(%)" : "(S/.)"}</Label>
              <Input
                id="c-valor"
                type="number"
                step="0.01"
                value={form.valor}
                onChange={(e) => setForm((f) => ({ ...f, valor: Number(e.target.value) }))}
              />
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="c-minimo">Monto mínimo de compra (S/.)</Label>
            <Input
              id="c-minimo"
              type="number"
              step="0.01"
              value={form.monto_minimo}
              onChange={(e) => setForm((f) => ({ ...f, monto_minimo: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="c-usos">Usos máximos</Label>
            <Input
              id="c-usos"
              type="number"
              value={form.usos_maximos ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  usos_maximos: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              placeholder="Ilimitado"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-desde">Vigente desde</Label>
            <Input
              id="c-desde"
              type="date"
              value={form.fecha_inicio ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, fecha_inicio: e.target.value || null }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-hasta">Vigente hasta</Label>
            <Input
              id="c-hasta"
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

        <Button type="submit" disabled={guardando} className="w-fit">
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </Modal>
  );
}
