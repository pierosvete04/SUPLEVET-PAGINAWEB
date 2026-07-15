"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IngredienteProducto } from "@/lib/ingredientes";

interface IngredienteFormProps {
  ingrediente: IngredienteProducto | null;
  onClose: () => void;
  onSaved: () => void;
}

const VACIO: Omit<IngredienteProducto, "id"> = {
  nombre: "",
  titulo: "",
  beneficios: [""],
  orden: 0,
  activo: true,
};

export function IngredienteForm({ ingrediente, onClose, onSaved }: IngredienteFormProps) {
  const [form, setForm] = useState<Omit<IngredienteProducto, "id">>(ingrediente ?? VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function actualizarBeneficio(i: number, valor: string) {
    setForm((f) => ({ ...f, beneficios: f.beneficios.map((b, idx) => (idx === i ? valor : b)) }));
  }

  function agregarBeneficio() {
    setForm((f) => ({ ...f, beneficios: [...f.beneficios, ""] }));
  }

  function quitarBeneficio(i: number) {
    setForm((f) => ({ ...f, beneficios: f.beneficios.filter((_, idx) => idx !== i) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    const payload = { ...form, beneficios: form.beneficios.map((b) => b.trim()).filter(Boolean) };
    const supabase = createClient();

    const { error: saveError } = ingrediente
      ? await supabase.from("ingredientes_producto").update(payload).eq("id", ingrediente.id)
      : await supabase.from("ingredientes_producto").insert(payload);

    if (saveError) {
      setError(saveError.message);
      setGuardando(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal titulo={ingrediente ? "Editar ingrediente" : "Nuevo ingrediente"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="i-nombre">Nombre corto (pill del selector)</Label>
          <Input
            id="i-nombre"
            required
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="i-titulo">Título completo (tarjeta de detalle)</Label>
          <Input
            id="i-titulo"
            required
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
          />
        </div>

        <div className="grid gap-1.5">
          <Label>Beneficios (viñetas)</Label>
          {form.beneficios.map((b, i) => (
            <div key={i} className="flex gap-2">
              <Input value={b} onChange={(e) => actualizarBeneficio(i, e.target.value)} />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => quitarBeneficio(i)}
                aria-label="Quitar beneficio"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={agregarBeneficio} className="w-fit">
            <Plus className="h-4 w-4" /> Añadir beneficio
          </Button>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="i-orden">Orden</Label>
          <Input
            id="i-orden"
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
