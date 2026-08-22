"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Trash2, Upload } from "lucide-react";
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
// saldo que alguien tenía que llevar de memoria. Acá cada comprobante va con
// su monto, y de la suma sale el estado del pago (lo calcula la API, no este
// componente).

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
  const [subiendo, setSubiendo] = useState(false);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const inputArchivoRef = useRef<HTMLInputElement>(null);

  const comprobantes = pedido.comprobantes ?? [];
  const total = Number(pedido.total);
  const cobrado = Number(pedido.monto_pagado ?? 0);
  const saldo = Math.max(total - cobrado, 0);
  const lleno = comprobantes.length >= MAX_COMPROBANTES;
  const cancelado = pedido.estado_pago === "cancelado";

  // Sugerencia por defecto: el saldo que falta. Es lo que el equipo registra
  // el 90% de las veces (el adelanto lo escribe a mano, el resto se autocompleta).
  const montoSugerido = saldo > 0 ? saldo.toFixed(2) : "";

  async function agregar(file: File) {
    const montoNumero = Number((monto || montoSugerido).replace(",", "."));
    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      toast.error("Escribe cuánto se cobró en este pago antes de subir el comprobante.");
      return;
    }

    setSubiendo(true);
    const url = await uploadFileToR2("pedidos-comprobantes", file, pedido.id);
    if (!url) {
      setSubiendo(false);
      toast.error("No se pudo subir el comprobante. Intenta de nuevo.");
      return;
    }

    const res = await fetch(`/api/admin/pedidos/${pedido.id}/comprobantes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, monto: montoNumero, nota }),
    });
    const data = await res.json().catch(() => null);
    setSubiendo(false);

    if (!res.ok) {
      toast.error(data?.error ?? "No se pudo registrar el pago.");
      return;
    }

    setMonto("");
    setNota("");
    await onCambio();

    if (data?.sobrepago > 0) {
      toast.warning(
        `Pago registrado. Ojo: se cobró ${formatSoles(data.sobrepago)} de más respecto al total del pedido.`
      );
      return;
    }
    if (data?.estado_pago === "parcial") {
      toast.success(`Pago registrado. Falta cobrar ${formatSoles(data.saldo_pendiente)}.`);
      return;
    }
    toast.success(
      data?.puntos_acreditados
        ? "Pedido cobrado por completo. Se acreditaron los SuplePoints pendientes."
        : "Pedido cobrado por completo."
    );
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
              : "Todavía no hay pagos registrados en este pedido."}
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
              />
            ))}
          </ul>
        )}

        {!lleno && !cancelado && (
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

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              disabled={subiendo}
              onClick={() => inputArchivoRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {subiendo ? "Subiendo…" : "Subir comprobante y registrar pago"}
            </Button>
            <input
              ref={inputArchivoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) agregar(file);
                e.target.value = "";
              }}
            />
          </div>
        )}

        {lleno && (
          <p className="border-t pt-4 text-xs text-muted-foreground">
            Este pedido ya tiene los {MAX_COMPROBANTES} comprobantes permitidos. Elimina uno si necesitas
            registrar otro pago.
          </p>
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
}: {
  comprobante: ComprobantePago;
  indice: number;
  total: number;
  eliminando: boolean;
  onEliminar: () => void;
}) {
  // Con un solo pago no hay adelanto ni saldo que distinguir; con dos o más el
  // orden sí cuenta, y el equipo necesita saber cuál fue primero.
  const etiqueta =
    total === 1 ? "Pago" : indice === 0 ? "1er pago (adelanto)" : `${indice + 1}° pago`;

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
        <p className="text-lg font-semibold">{formatSoles(Number(comprobante.monto))}</p>
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
