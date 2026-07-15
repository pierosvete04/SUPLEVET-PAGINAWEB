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
import type { ValorNosotros } from "@/lib/valores-nosotros";

interface ValorFormProps {
  valor: ValorNosotros | null;
  onClose: () => void;
  onSaved: () => void;
}

// Debe coincidir con el mapa de íconos de app/nosotros/page.tsx
const ICONOS_DISPONIBLES = ["Beaker", "Heart", "Lightbulb", "Shield", "Star", "Award", "Leaf", "Users"];

const VACIO: Omit<ValorNosotros, "id"> = {
  icono: "Heart",
  titulo: "",
  texto: "",
  orden: 0,
  activo: true,
};

export function ValorForm({ valor, onClose, onSaved }: ValorFormProps) {
  const [form, setForm] = useState<Omit<ValorNosotros, "id">>(valor ?? VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    const supabase = createClient();

    const { error: saveError } = valor
      ? await supabase.from("valores_nosotros").update(form).eq("id", valor.id)
      : await supabase.from("valores_nosotros").insert(form);

    if (saveError) {
      setError(saveError.message);
      setGuardando(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal titulo={valor ? "Editar valor" : "Nuevo valor"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="v-titulo">Título</Label>
          <Input
            id="v-titulo"
            required
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="v-texto">Texto</Label>
          <Textarea
            id="v-texto"
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
          <Label htmlFor="v-orden">Orden</Label>
          <Input
            id="v-orden"
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
