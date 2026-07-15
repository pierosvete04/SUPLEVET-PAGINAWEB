"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DetalleEventoSalud, MascotaEvento, TipoEventoSalud } from "@/lib/data/portal/mascotas";
import { TIPOS_SALUD } from "@/lib/data/portal/mascotas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

interface SaludEventoFormDialogProps {
  clienteId: string;
  mascotaId: string;
  evento: MascotaEvento | null;
  tipoInicial?: TipoEventoSalud;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const hoyISO = () => new Date().toISOString().slice(0, 10);

export function SaludEventoFormDialog({
  clienteId,
  mascotaId,
  evento,
  tipoInicial,
  open,
  onClose,
  onSaved,
}: SaludEventoFormDialogProps) {
  const [tipo, setTipo] = useState<TipoEventoSalud>("vacuna");
  const [titulo, setTitulo] = useState("");
  const [producto, setProducto] = useState("");
  const [veterinario, setVeterinario] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [proximaFecha, setProximaFecha] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (evento) {
      let detalle: DetalleEventoSalud = {};
      try {
        detalle = JSON.parse(evento.detalle ?? "{}");
      } catch {
        detalle = {};
      }
      setTipo(evento.tipo);
      setTitulo(evento.titulo);
      setProducto(detalle.producto ?? "");
      setVeterinario(detalle.veterinario ?? "");
      setFecha(evento.fecha?.slice(0, 10) ?? hoyISO());
      setProximaFecha(detalle.proxima_fecha ?? "");
      setNotas(detalle.notas ?? "");
    } else {
      setTipo(tipoInicial ?? "vacuna");
      setTitulo("");
      setProducto("");
      setVeterinario("");
      setFecha(hoyISO());
      setProximaFecha("");
      setNotas("");
    }
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, evento, tipoInicial]);

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) {
      setError("Ingresa un título");
      return;
    }
    setGuardando(true);
    const detalle: DetalleEventoSalud = {};
    if (producto.trim()) detalle.producto = producto.trim();
    if (veterinario.trim()) detalle.veterinario = veterinario.trim();
    if (proximaFecha) detalle.proxima_fecha = proximaFecha;
    if (notas.trim()) detalle.notas = notas.trim();

    const supabase = createClient();
    const payload = {
      mascota_id: mascotaId,
      cliente_id: clienteId,
      tipo,
      titulo: titulo.trim(),
      detalle: JSON.stringify(detalle),
      fecha,
    };

    const { error: saveError } = evento
      ? await supabase.from("mascota_eventos").update(payload).eq("id", evento.id)
      : await supabase.from("mascota_eventos").insert(payload);

    setGuardando(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{evento ? "Editar registro" : "Nuevo registro de salud"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleGuardar} className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoEventoSalud)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPOS_SALUD).map(([valor, t]) => (
                  <SelectItem key={valor} value={valor}>
                    {t.emoji} {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Título</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Vacuna Nobivac" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Producto</Label>
              <Input value={producto} onChange={(e) => setProducto(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Veterinario</Label>
              <Input value={veterinario} onChange={(e) => setVeterinario(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Fecha</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Próxima fecha (opcional)</Label>
              <Input type="date" value={proximaFecha} onChange={(e) => setProximaFecha(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Notas</Label>
            <Textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>
          {error && <p className="font-body text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={guardando} className="ml-auto">
            {guardando ? "Guardando…" : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
