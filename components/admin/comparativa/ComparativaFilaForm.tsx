"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ComparativaFila } from "@/lib/comparativa";

interface ComparativaFilaFormProps {
  fila: ComparativaFila | null;
  onClose: () => void;
  onSaved: () => void;
}

const VACIO: Omit<ComparativaFila, "id"> = {
  beneficio: "",
  suplevet_titulo: "",
  suplevet_texto: "",
  otros_titulo: "",
  otros_texto: "",
  orden: 0,
  activo: true,
};

export function ComparativaFilaForm({ fila, onClose, onSaved }: ComparativaFilaFormProps) {
  const [form, setForm] = useState<Omit<ComparativaFila, "id">>(fila ?? VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    const supabase = createClient();

    const { error: saveError } = fila
      ? await supabase.from("comparativa_filas").update(form).eq("id", fila.id)
      : await supabase.from("comparativa_filas").insert(form);

    if (saveError) {
      setError(saveError.message);
      setGuardando(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal titulo={fila ? "Editar fila comparativa" : "Nueva fila comparativa"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="c-beneficio">Beneficio clave</Label>
          <Input
            id="c-beneficio"
            required
            value={form.beneficio}
            onChange={(e) => setForm((f) => ({ ...f, beneficio: e.target.value }))}
          />
        </div>

        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
          <p className="mb-3 font-body text-xs font-bold uppercase tracking-wide text-secondary">
            Columna Suplevet
          </p>
          <div className="flex flex-col gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="c-sup-titulo">Título</Label>
              <Input
                id="c-sup-titulo"
                required
                value={form.suplevet_titulo}
                onChange={(e) => setForm((f) => ({ ...f, suplevet_titulo: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-sup-texto">Texto</Label>
              <Textarea
                id="c-sup-texto"
                required
                rows={3}
                value={form.suplevet_texto}
                onChange={(e) => setForm((f) => ({ ...f, suplevet_texto: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-soft-gray p-4">
          <p className="mb-3 font-body text-xs font-bold uppercase tracking-wide text-secondary">
            Columna Otros suplementos
          </p>
          <div className="flex flex-col gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="c-otros-titulo">Título</Label>
              <Input
                id="c-otros-titulo"
                required
                value={form.otros_titulo}
                onChange={(e) => setForm((f) => ({ ...f, otros_titulo: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-otros-texto">Texto</Label>
              <Textarea
                id="c-otros-texto"
                required
                rows={3}
                value={form.otros_texto}
                onChange={(e) => setForm((f) => ({ ...f, otros_texto: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="c-orden">Orden</Label>
          <Input
            id="c-orden"
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
          Activa (visible en la web)
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={guardando} className="w-fit">
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </Modal>
  );
}
