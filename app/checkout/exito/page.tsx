"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { formatPrecio } from "@/lib/data/productos-shared";

interface PedidoSimulado {
  numero: string;
  metodo: "tarjeta" | "yape_plin" | "transferencia";
  total: number;
}

const mensajePorMetodo: Record<PedidoSimulado["metodo"], string> = {
  tarjeta: "¡Tu pago fue confirmado!",
  yape_plin: "Recibimos tu pedido — estamos validando tu pago",
  transferencia: "Recibimos tu pedido — estamos validando tu pago",
};

export default function CheckoutExitoPage() {
  const [pedido, setPedido] = useState<PedidoSimulado | null>(null);

  useEffect(() => {
    const guardado = sessionStorage.getItem("ultimo_pedido");
    if (guardado) setPedido(JSON.parse(guardado));
  }, []);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-mobile-margin py-section-y text-center">
      <CheckCircle2 className="h-16 w-16 text-green-500" strokeWidth={1.5} />
      <h1 className="font-display text-3xl font-bold text-secondary">
        {pedido ? mensajePorMetodo[pedido.metodo] : "¡Gracias por tu compra!"}
      </h1>

      {pedido && (
        <div className="mt-2 w-full rounded-xl border border-border p-5 text-left font-body text-sm text-secondary">
          <div className="flex justify-between">
            <span>N° de pedido</span>
            <span className="font-bold">{pedido.numero}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span>Total</span>
            <span className="font-bold text-primary">{formatPrecio(pedido.total)}</span>
          </div>
          {pedido.metodo !== "tarjeta" && (
            <p className="mt-3 text-xs text-muted-foreground">
              Te enviaremos las instrucciones de pago y confirmaremos por WhatsApp y correo en las
              próximas horas.
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <Link
          href="/productos"
          className="rounded-full bg-primary px-6 py-3 font-body font-bold text-primary-foreground hover:opacity-90"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
