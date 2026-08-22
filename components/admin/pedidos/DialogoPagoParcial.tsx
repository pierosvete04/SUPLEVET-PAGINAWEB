"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatSoles } from "@/lib/data/pedidos-admin";

// Marcar un pedido como "Pago parcial" a mano, desde la lista o desde la ficha.
// Pide el monto porque sin él el estado no sirve para nada práctico: el saldo
// que el rótulo le imprime al motorizado sale de esa resta, y un parcial sin
// monto haría que se le cobre el total otra vez a alguien que ya adelantó.
// El comprobante sí es opcional acá: a veces el voucher llega después, y para
// eso está la tarjeta de comprobantes de la ficha del pedido.

interface Props {
  /** Pedido a marcar; null cierra el diálogo. */
  pedido: { id: string; numero_pedido: string | null; total: number } | null;
  onCerrar: () => void;
  onGuardado: (datos: { monto_pagado: number; saldo_pendiente: number }) => void;
}

export function DialogoPagoParcial({ pedido, onCerrar, onGuardado }: Props) {
  const [monto, setMonto] = useState("");
  const [guardando, setGuardando] = useState(false);

  const total = Number(pedido?.total ?? 0);
  // La mitad es el caso de lejos más común (el cliente adelanta el 50% y paga
  // el resto al recibir), así que viene propuesta y se puede sobrescribir.
  const sugerido = (Math.round((total / 2) * 100) / 100).toFixed(2);

  useEffect(() => {
    if (pedido) setMonto(sugerido);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido?.id]);

  const montoNumero = Number(monto.replace(",", "."));
  const montoValido = Number.isFinite(montoNumero) && montoNumero > 0 && montoNumero < total;
  const saldo = montoValido ? Math.round((total - montoNumero) * 100) / 100 : 0;

  async function guardar() {
    if (!pedido || !montoValido) return;
    setGuardando(true);
    // Un único endpoint escribe el monto cobrado y de ahí sale el estado
    // (ver lib/pedidos/cobro): así el diálogo y la tarjeta de comprobantes no
    // se pisan el número entre ellos.
    const res = await fetch(`/api/admin/pedidos/${pedido.id}/monto-cobrado`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monto_pagado: montoNumero }),
    });
    const data = await res.json().catch(() => null);
    setGuardando(false);

    if (!res.ok) {
      toast.error(data?.error ?? "No se pudo marcar el pago parcial.");
      return;
    }
    onGuardado({ monto_pagado: data.monto_pagado, saldo_pendiente: data.saldo_pendiente });
    onCerrar();
    toast.success(`Pago parcial registrado. Falta cobrar ${formatSoles(data.saldo_pendiente)}.`);
  }

  return (
    <AlertDialog open={!!pedido} onOpenChange={(open) => !open && onCerrar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Pago parcial del pedido {pedido?.numero_pedido ?? ""}
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Cuánto te ha pagado el cliente hasta ahora? El resto se cobra al entregar, y es lo que va
            a salir impreso en el rótulo.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-1.5">
          <Label htmlFor="monto-parcial">Monto ya cobrado</Label>
          <Input
            id="monto-parcial"
            inputMode="decimal"
            value={monto}
            autoFocus
            onChange={(e) => setMonto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && montoValido) guardar();
            }}
            aria-invalid={!montoValido && monto !== ""}
          />
          <p className={`text-xs ${montoValido ? "text-muted-foreground" : "text-destructive"}`}>
            {montoValido
              ? `Total del pedido ${formatSoles(total)} — quedará un saldo de ${formatSoles(saldo)} por cobrar.`
              : `Escribe un monto mayor que 0 y menor que el total (${formatSoles(total)}). Si ya pagó todo, usa "Pagado".`}
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Volver</AlertDialogCancel>
          <AlertDialogAction
            disabled={guardando || !montoValido}
            onClick={(e) => {
              // El AlertDialogAction cierra el diálogo al hacer click; se corta
              // para que no se cierre antes de que la API responda (si falla,
              // el monto escrito sigue ahí).
              e.preventDefault();
              guardar();
            }}
          >
            {guardando ? "Guardando…" : "Marcar pago parcial"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
