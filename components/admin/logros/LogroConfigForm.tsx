"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LogroConfig } from "@/lib/data/portal/logros";
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

interface LogroConfigFormProps {
  logro: LogroConfig | null;
  onClose: () => void;
  onSaved: () => void;
}

const CONDICIONES = [
  { valor: "mascota_count", label: "Cantidad de mascotas registradas" },
  { valor: "compras_count", label: "Cantidad de compras" },
  { valor: "meses_activo", label: "Meses como cliente" },
  { valor: "perfil_completo", label: "Perfil completo" },
  { valor: "nivel_silver", label: "Alcanza nivel Silver" },
  { valor: "nivel_gold", label: "Alcanza nivel Gold" },
  { valor: "nivel_diamond", label: "Alcanza nivel Diamond" },
  { valor: "referido", label: "Cantidad de referidos" },
];

const VACIO: Omit<LogroConfig, "id"> = {
  clave: "",
  nombre: "",
  descripcion: null,
  icon: "military_tech",
  condicion_tipo: "mascota_count",
  condicion_valor: 1,
  orden: 0,
  activo: true,
};

export function LogroConfigForm({ logro, onClose, onSaved }: LogroConfigFormProps) {
  const [form, setForm] = useState<Omit<LogroConfig, "id">>(logro ?? VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clave.trim() || !form.nombre.trim()) {
      setError("Clave y nombre son obligatorios.");
      return;
    }
    setGuardando(true);
    setError(null);
    const supabase = createClient();

    const { error: saveError } = logro
      ? await supabase.from("logros_config").update(form).eq("id", logro.id)
      : await supabase.from("logros_config").insert(form);

    if (saveError) {
      setError(saveError.message);
      setGuardando(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal titulo={logro ? "Editar logro" : "Nuevo logro"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="l-clave">Clave (identificador único)</Label>
            <Input
              id="l-clave"
              required
              value={form.clave}
              onChange={(e) => setForm((f) => ({ ...f, clave: e.target.value }))}
              placeholder="ej: primera_mascota"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="l-nombre">Nombre</Label>
            <Input
              id="l-nombre"
              required
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="l-desc">Descripción</Label>
          <Textarea
            id="l-desc"
            rows={2}
            value={form.descripcion ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value || null }))}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="l-icon">
            Ícono (nombre de{" "}
            <a
              href="https://fonts.google.com/icons?icon.style=Rounded"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Material Symbols Rounded
            </a>
            )
          </Label>
          <Input
            id="l-icon"
            value={form.icon}
            onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
            placeholder="ej: pets"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label>Condición para desbloquear</Label>
            <Select
              value={form.condicion_tipo ?? ""}
              onValueChange={(v) => setForm((f) => ({ ...f, condicion_tipo: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona…" />
              </SelectTrigger>
              <SelectContent>
                {CONDICIONES.map((c) => (
                  <SelectItem key={c.valor} value={c.valor}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="l-valor">Valor requerido</Label>
            <Input
              id="l-valor"
              type="number"
              value={form.condicion_valor ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, condicion_valor: e.target.value ? Number(e.target.value) : null }))
              }
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="l-orden">Orden</Label>
          <Input
            id="l-orden"
            type="number"
            value={form.orden ?? 0}
            onChange={(e) => setForm((f) => ({ ...f, orden: Number(e.target.value) }))}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={!!form.activo}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, activo: checked === true }))}
          />
          Activo (visible en el portal)
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={guardando} className="w-fit">
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </Modal>
  );
}
