"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TIPOS_CONDICION_MEDICA, type CondicionMedica, type TipoCondicionMedica } from "@/lib/data/portal/mascotas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CondicionMedicaFormDialogProps {
  mascotaId: string;
  condicionesActuales: CondicionMedica[];
  // Índice dentro de condicionesActuales que se está editando, o null para
  // agregar una nueva. Como condiciones_medicas vive como un solo jsonb en la
  // fila de la mascota (no una tabla propia), cada guardado reescribe el
  // arreglo completo en vez de un update por id.
  indexEditar: number | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function CondicionMedicaFormDialog({
  mascotaId,
  condicionesActuales,
  indexEditar,
  open,
  onClose,
  onSaved,
}: CondicionMedicaFormDialogProps) {
  const [tipo, setTipo] = useState<TipoCondicionMedica>("alergia");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editando = indexEditar !== null ? condicionesActuales[indexEditar] : null;

  useEffect(() => {
    if (!open) return;
    setTipo(editando?.tipo ?? "alergia");
    setDescripcion(editando?.descripcion ?? "");
    setFecha(editando?.fecha ?? "");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, indexEditar]);

  async function guardarArreglo(nuevoArreglo: CondicionMedica[]) {
    setGuardando(true);
    setError(null);
    const { error: saveError } = await createClient()
      .from("mascotas")
      .update({ condiciones_medicas: nuevoArreglo })
      .eq("id", mascotaId);
    setGuardando(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    onSaved();
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!descripcion.trim()) {
      setError("Describe la condición");
      return;
    }
    const nueva: CondicionMedica = { tipo, descripcion: descripcion.trim(), fecha: fecha || null };
    const nuevoArreglo =
      indexEditar !== null
        ? condicionesActuales.map((c, i) => (i === indexEditar ? nueva : c))
        : [...condicionesActuales, nueva];
    await guardarArreglo(nuevoArreglo);
  }

  async function handleEliminar() {
    if (indexEditar === null) return;
    if (!confirm("¿Eliminar esta condición médica?")) return;
    await guardarArreglo(condicionesActuales.filter((_, i) => i !== indexEditar));
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-sm overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar condición médica" : "Nueva condición médica"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleGuardar} className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoCondicionMedica)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPOS_CONDICION_MEDICA).map(([valor, label]) => (
                  <SelectItem key={valor} value={valor}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Descripción</Label>
            <Input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: alergia al pollo, displasia de cadera…"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Fecha (opcional)</Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          {error && <p className="font-body text-sm text-destructive">{error}</p>}
          <div className="flex items-center justify-between gap-2">
            {editando ? (
              <button
                type="button"
                onClick={handleEliminar}
                disabled={guardando}
                className="text-xs font-semibold text-destructive/70 hover:text-destructive"
              >
                Eliminar
              </button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={guardando} className="ml-auto">
              {guardando ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
