"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Faq } from "@/lib/faqs";

interface FaqFormProps {
  faq: Faq | null;
  onClose: () => void;
  onSaved: () => void;
}

const VACIO: Omit<Faq, "id"> = {
  pregunta: "",
  respuesta: "",
  orden: 0,
  activo: true,
};

export function FaqForm({ faq, onClose, onSaved }: FaqFormProps) {
  const [form, setForm] = useState<Omit<Faq, "id">>(faq ?? VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    const supabase = createClient();

    const { error: saveError } = faq
      ? await supabase.from("faqs").update(form).eq("id", faq.id)
      : await supabase.from("faqs").insert(form);

    if (saveError) {
      setError(saveError.message);
      setGuardando(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal titulo={faq ? "Editar pregunta" : "Nueva pregunta"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="f-pregunta">Pregunta</Label>
          <Input
            id="f-pregunta"
            required
            value={form.pregunta}
            onChange={(e) => setForm((f) => ({ ...f, pregunta: e.target.value }))}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="f-respuesta">Respuesta</Label>
          <Textarea
            id="f-respuesta"
            required
            rows={4}
            value={form.respuesta}
            onChange={(e) => setForm((f) => ({ ...f, respuesta: e.target.value }))}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="f-orden">Orden</Label>
          <Input
            id="f-orden"
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
