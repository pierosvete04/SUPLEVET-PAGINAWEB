"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CursoModulo } from "@/lib/cursos";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ModuloFormProps {
  cursoId: string;
  modulo: CursoModulo | null;
  siguienteOrden: number;
  onClose: () => void;
  onSaved: () => void;
}

export function ModuloForm({ cursoId, modulo, siguienteOrden, onClose, onSaved }: ModuloFormProps) {
  const [titulo, setTitulo] = useState(modulo?.titulo ?? "");
  const [orden, setOrden] = useState(modulo?.orden ?? siguienteOrden);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    setGuardando(true);
    setError(null);
    const supabase = createClient();
    const payload = { curso_id: cursoId, titulo: titulo.trim(), orden };

    const { error: saveError } = modulo
      ? await supabase.from("curso_modulos").update(payload).eq("id", modulo.id)
      : await supabase.from("curso_modulos").insert(payload);

    if (saveError) {
      setError(saveError.message);
      setGuardando(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal titulo={modulo ? "Editar módulo" : "Nuevo módulo"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="m-titulo">Título del módulo</Label>
          <Input
            id="m-titulo"
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="ej: Módulo 1: Fundamentos Nutricionales"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="m-orden">Orden</Label>
          <Input id="m-orden" type="number" value={orden} onChange={(e) => setOrden(Number(e.target.value))} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={guardando} className="w-fit">
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </Modal>
  );
}
