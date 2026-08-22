"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Check, Pencil, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadFileToR2 } from "@/lib/uploadToR2";
import {
  MAX_COMPROBANTES,
  formatSoles,
  type ComprobantePago,
  type PedidoAdmin,
} from "@/lib/data/pedidos-admin";

// Reemplaza la tarjeta de "Captura de pago", que aceptaba una sola imagen.
// El caso que la rompía: el cliente que adelanta la mitad al hacer el pedido y
// paga el resto cuando Dinsides se lo entrega — dos pagos, dos vouchers y un
// saldo que alguien tenía que llevar de memoria.
//
// Un pago se puede registrar CON o SIN comprobante: el cobro en efectivo en la
// puerta no deja voucher, y a veces la captura llega horas después del pago.
// Por eso hay dos botones y no uno.

interface Props {
  pedido: PedidoAdmin;
  formaPagoLabel: string;
  /** Solo informativo: Yape y transferencia no se pueden confirmar sin al
   * menos un comprobante. */
  requiereComprobante: boolean;
  onCambio: () => Promise<void> | void;
}

function formatFechaComprobante(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

export function ComprobantesPago({ pedido, formaPagoLabel, requiereComprobante, onCambio }: Props) {
  const [monto, setMonto] = useState("");
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const inputArchivoRef = useRef<HTMLInputElement>(null);

  const comprobantes = pedido.comprobantes ?? [];
  const total = Number(pedido.total);
  const cobrado = Number(pedido.monto_pagado ?? 0);
  const saldo = Math.max(total - cobrado, 0);
  const lleno = comprobantes.length >= MAX_COMPROBANTES;
  const cancelado = pedido.estado_pago === "cancelado";

  // Sugerencia por defecto: el saldo que falta, que es lo que se registra el
  // 90% de las veces (el adelanto se escribe a mano, el resto se autocompleta).
  const montoSugerido = saldo > 0 ? saldo.toFixed(2) : "";

  function montoAUsar(): number | null {
    const numero = Number((monto || montoSugerido).replace(",", "."));
    if (!Number.isFinite(numero) || numero <= 0) return null;
    return numero;
  }

  /** Mensaje común a registrar un pago con o sin comprobante. */
  function avisarResultado(data: {
    sobrepago?: number;
    estado_pago?: string;
    saldo_pendiente?: number;
    puntos_acreditados?: boolean;
  }) {
    if (data?.sobrepago && data.sobrepago > 0) {
      toast.warning(
        `Pago registrado. Ojo: se cobró ${formatSoles(data.sobrepago)} de más respecto al total del pedido.`
      );
      return;
    }
    if (data?.estado_pago === "parcial") {
      toast.success(`Pago registrado. Falta cobrar ${formatSoles(data.saldo_pendiente ?? 0)}.`);
      return;
    }
    toast.success(
      data?.puntos_acreditados
        ? "Pedido cobrado por completo. Se acreditaron los SuplePoints pendientes."
        : "Pedido cobrado por completo."
    );
  }

  /** Registra el pago sin voucher: fija cuánto se lleva cobrado en total. */
  async function registrarSinComprobante() {
    const montoNumero = montoAUsar();
    if (montoNumero === null) {
      toast.error("Escribe cuánto se ha cobrado.");
      return;
    }

    setGuardando(true);
    const res = await fetch(`/api/admin/pedidos/${pedido.id}/monto-cobrado`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monto_pagado: cobrado + montoNumero }),
    });
    const data = await res.json().catch(() => null);
    setGuardando(false);

    if (!res.ok) {
      toast.error(data?.error ?? "No se pudo registrar el pago.");
      return;
    }
    setMonto("");
    setNota("");
    await onCambio();
    avisarResultado(data);
  }

  async function agregarConComprobante(file: File) {
    const montoNumero = montoAUsar();
    if (montoNumero === null) {
      toast.error("Escribe cuánto se cobró en este pago antes de subir el comprobante.");
      return;
    }

    setGuardando(true);
    const url = await uploadFileToR2("pedidos-comprobantes", file, pedido.id);
    if (!url) {
      setGuardando(false);
      toast.error("No se pudo subir el comprobante. Intenta de nuevo.");
      return;
    }

    const res = await fetch(`/api/admin/pedidos/${pedido.id}/comprobantes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, monto: montoNumero, nota }),
    });
    const data = await res.json().catch(() => null);
    setGuardando(false);

    if (!res.ok) {
      toast.error(data?.error ?? "No se pudo registrar el pago.");
      return;
    }
    setMonto("");
    setNota("");
    await onCambio();
    avisarResultado(data);
  }

  async function corregirMonto(indice: number, montoNuevo: number) {
    const res = await fetch(`/api/admin/pedidos/${pedido.id}/comprobantes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ indice, monto: montoNuevo }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      toast.error(data?.error ?? "No se pudo corregir el monto.");
      return false;
    }
    await onCambio();
    toast.success(
      data?.estado_pago === "parcial"
        ? `Monto corregido. Falta cobrar ${formatSoles(data.saldo_pendiente)}.`
        : "Monto corregido."
    );
    return true;
  }

  async function eliminar(indice: number) {
    setEliminando(indice);
    const res = await fetch(`/api/admin/pedidos/${pedido.id}/comprobantes?indice=${indice}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => null);
    setEliminando(null);

    if (!res.ok) {
      toast.error(data?.error ?? "No se pudo eliminar el comprobante.");
      return;
    }
    await onCambio();
    toast.success("Comprobante eliminado.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">
          Comprobantes de pago ({formaPagoLabel})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ResumenCobro total={total} cobrado={cobrado} saldo={saldo} />

        {comprobantes.length === 0 ? (
          <p className={`text-sm ${requiereComprobante ? "text-amber-700" : "text-muted-foreground"}`}>
            {requiereComprobante
              ? `Este pedido usa ${formaPagoLabel.toLowerCase()}: registra el comprobante antes de poder confirmar el pago.`
              : "Todavía no hay comprobantes registrados en este pedido."}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {comprobantes.map((comprobante, i) => (
              <ComprobanteItem
                key={`${comprobante.url}-${i}`}
                comprobante={comprobante}
                indice={i}
                total={comprobantes.length}
                eliminando={eliminando === i}
                onEliminar={() => eliminar(i)}
                onCorregirMonto={(montoNuevo) => corregirMonto(i, montoNuevo)}
              />
            ))}
          </ul>
        )}

        {!cancelado && (
          <div className="flex flex-col gap-3 border-t pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="monto-comprobante">Monto cobrado en este pago</Label>
                <Input
                  id="monto-comprobante"
                  inputMode="decimal"
                  value={monto}
                  placeholder={montoSugerido ? `Ej. ${montoSugerido}` : "Ej. 89.95"}
                  onChange={(e) => setMonto(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {saldo > 0
                    ? `Si lo dejas vacío se registra el saldo completo (${formatSoles(saldo)}).`
                    : "Este pedido ya está cobrado por completo."}
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="nota-comprobante">
                  Nota <span className="font-normal text-muted-foreground">· opcional</span>
                </Label>
                <Input
                  id="nota-comprobante"
                  value={nota}
                  placeholder="Ej. adelanto por Yape"
                  maxLength={120}
                  onChange={(e) => setNota(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Para distinguir el adelanto del saldo cuando haya varios.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={guardando || lleno}
                onClick={() => inputArchivoRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {guardando ? "Guardando…" : "Subir comprobante y registrar pago"}
              </Button>
              {/* El cobro en efectivo en la puerta no deja voucher, y a veces la
                  captura llega después. Sin este botón el monto escrito no se
                  podía guardar de ninguna forma. */}
              <Button type="button" size="sm" disabled={guardando} onClick={registrarSinComprobante}>
                Guardar sin comprobante
              </Button>
            </div>
            {lleno && (
              <p className="text-xs text-muted-foreground">
                Ya hay {MAX_COMPROBANTES} comprobantes (el máximo). Puedes seguir registrando pagos sin
                comprobante, o eliminar uno para subir otro.
              </p>
            )}

            <input
              ref={inputArchivoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) agregarConComprobante(file);
                e.target.value = "";
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** El bloque que responde la pregunta que se hace el equipo al abrir el
 * pedido: ¿cuánto falta cobrar? */
function ResumenCobro({ total, cobrado, saldo }: { total: number; cobrado: number; saldo: number }) {
  return (
    <div className="grid grid-cols-3 gap-3 rounded-lg bg-soft-gray p-3 text-center">
      <div>
        <p className="text-xs text-muted-foreground">Total del pedido</p>
        <p className="font-semibold">{formatSoles(total)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Cobrado</p>
        <p className="font-semibold text-green-700">{formatSoles(cobrado)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Falta cobrar</p>
        <p className={`font-semibold ${saldo > 0 ? "text-amber-700" : "text-muted-foreground"}`}>
          {formatSoles(saldo)}
        </p>
      </div>
    </div>
  );
}

function ComprobanteItem({
  comprobante,
  indice,
  total,
  eliminando,
  onEliminar,
  onCorregirMonto,
}: {
  comprobante: ComprobantePago;
  indice: number;
  total: number;
  eliminando: boolean;
  onEliminar: () => void;
  onCorregirMonto: (monto: number) => Promise<boolean>;
}) {
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(String(comprobante.monto ?? ""));
  const [guardando, setGuardando] = useState(false);

  // Con un solo pago no hay adelanto ni saldo que distinguir; con dos o más el
  // orden sí cuenta, y el equipo necesita saber cuál fue primero.
  const etiqueta =
    total === 1 ? "Pago" : indice === 0 ? "1er pago (adelanto)" : `${indice + 1}° pago`;

  async function guardar() {
    const numero = Number(borrador.replace(",", "."));
    if (!Number.isFinite(numero) || numero <= 0) return;
    setGuardando(true);
    const ok = await onCorregirMonto(numero);
    setGuardando(false);
    if (ok) setEditando(false);
  }

  return (
    <li className="flex gap-3 rounded-lg border p-3">
      <a
        href={comprobante.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-soft-gray"
      >
        <Image src={comprobante.url} alt={etiqueta} fill className="object-contain" sizes="80px" />
      </a>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <p className="text-xs text-muted-foreground">{etiqueta}</p>
        {editando ? (
          <div className="flex items-center gap-1.5">
            <Input
              value={borrador}
              inputMode="decimal"
              autoFocus
              className="h-8 w-28"
              onChange={(e) => setBorrador(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") guardar();
                if (e.key === "Escape") setEditando(false);
              }}
            />
            <Button type="button" size="sm" variant="ghost" disabled={guardando} onClick={guardar}>
              <Check className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setBorrador(String(comprobante.monto ?? ""));
                setEditando(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="group flex w-fit items-center gap-1.5 text-lg font-semibold"
            onClick={() => setEditando(true)}
            title="Corregir el monto de este pago"
          >
            {formatSoles(Number(comprobante.monto))}
            <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}
        <p className="text-xs text-muted-foreground">
          {formatFechaComprobante(comprobante.fecha)}
          {comprobante.nota ? ` · ${comprobante.nota}` : ""}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-fit self-center text-destructive hover:text-destructive"
        disabled={eliminando}
        onClick={onEliminar}
        aria-label={`Eliminar ${etiqueta}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}
