"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SuplepuntosConfig, TipoSuplepuntosConfig } from "@/lib/data/portal/puntos";
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

interface SuplepuntosConfigFormProps {
  config: SuplepuntosConfig | null;
  onClose: () => void;
  onSaved: () => void;
}

const TIPOS: { valor: TipoSuplepuntosConfig; label: string }[] = [
  { valor: "accion", label: "Forma de ganar puntos" },
  { valor: "canje_descuento", label: "Canje: descuento" },
  { valor: "canje_envio", label: "Canje: envío gratis" },
  { valor: "canje_producto", label: "Canje: producto" },
  { valor: "multiplicador", label: "Multiplicador" },
];

const VACIO: Omit<SuplepuntosConfig, "id"> = {
  tipo: "accion",
  clave: "",
  nombre: "",
  descripcion: null,
  puntos_requeridos: null,
  puntos_otorgados: null,
  multiplicador: null,
  valor_sol: null,
  activo: true,
  limite_por_cliente: null,
  limite_periodo: null,
  es_lanzamiento: false,
};

export function SuplepuntosConfigForm({ config, onClose, onSaved }: SuplepuntosConfigFormProps) {
  const [form, setForm] = useState<Omit<SuplepuntosConfig, "id">>(config ?? VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esCanje = form.tipo.startsWith("canje_");
  const esAccion = form.tipo === "accion";
  const esMultiplicador = form.tipo === "multiplicador";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clave.trim() || !form.nombre.trim()) {
      setError("Clave y nombre son obligatorios.");
      return;
    }
    setGuardando(true);
    setError(null);
    const supabase = createClient();

    const { error: saveError } = config
      ? await supabase.from("suplepuntos_config").update(form).eq("id", config.id)
      : await supabase.from("suplepuntos_config").insert(form);

    if (saveError) {
      setError(saveError.message);
      setGuardando(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal titulo={config ? "Editar configuración" : "Nueva configuración"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label>Tipo</Label>
          <Select
            value={form.tipo}
            onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as TipoSuplepuntosConfig }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS.map((t) => (
                <SelectItem key={t.valor} value={t.valor}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="sc-clave">Clave (identificador único)</Label>
            <Input
              id="sc-clave"
              required
              value={form.clave}
              onChange={(e) => setForm((f) => ({ ...f, clave: e.target.value }))}
              placeholder="ej: canje_descuento_10"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sc-nombre">Nombre</Label>
            <Input
              id="sc-nombre"
              required
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="sc-descripcion">Descripción</Label>
          <Textarea
            id="sc-descripcion"
            rows={2}
            value={form.descripcion ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value || null }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {esCanje && (
            <div className="grid gap-1.5">
              <Label htmlFor="sc-req">Puntos requeridos</Label>
              <Input
                id="sc-req"
                type="number"
                value={form.puntos_requeridos ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, puntos_requeridos: e.target.value ? Number(e.target.value) : null }))
                }
              />
            </div>
          )}
          {esAccion && (
            <div className="grid gap-1.5">
              <Label htmlFor="sc-otorg">Puntos otorgados</Label>
              <Input
                id="sc-otorg"
                type="number"
                value={form.puntos_otorgados ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, puntos_otorgados: e.target.value ? Number(e.target.value) : null }))
                }
              />
            </div>
          )}
          {esMultiplicador && (
            <div className="grid gap-1.5">
              <Label htmlFor="sc-mult">Multiplicador (ej: 2 = doble puntos)</Label>
              <Input
                id="sc-mult"
                type="number"
                step="0.1"
                value={form.multiplicador ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, multiplicador: e.target.value ? Number(e.target.value) : null }))
                }
              />
            </div>
          )}
          {esCanje && (
            <div className="grid gap-1.5">
              <Label htmlFor="sc-valor-sol">Valor en soles (opcional)</Label>
              <Input
                id="sc-valor-sol"
                type="number"
                step="0.01"
                value={form.valor_sol ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, valor_sol: e.target.value ? Number(e.target.value) : null }))}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="sc-limite">Límite por cliente (opcional)</Label>
            <Input
              id="sc-limite"
              type="number"
              value={form.limite_por_cliente ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, limite_por_cliente: e.target.value ? Number(e.target.value) : null }))
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sc-periodo">Período del límite (opcional)</Label>
            <Input
              id="sc-periodo"
              placeholder="ej: anual, mensual"
              value={form.limite_periodo ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, limite_periodo: e.target.value || null }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!form.activo}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, activo: checked === true }))}
            />
            Activo (visible/aplicable en el portal)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!form.es_lanzamiento}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, es_lanzamiento: checked === true }))}
            />
            Es promoción de lanzamiento
          </label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={guardando} className="w-fit">
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </Modal>
  );
}
