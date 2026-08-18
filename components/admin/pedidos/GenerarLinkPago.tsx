"use client";

import { useState } from "react";
import { Check, Copy, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface GenerarLinkPagoProps {
  pedidoId: string;
  /** Solo tiene sentido para "tarjeta" — el componente no se renderiza para otros métodos. */
  formaPago: string;
  /** /api/checkout/mercadopago solo acepta pedidos "pendiente_verificacion" — si ya
   * se marcó pagado a mano, no tiene sentido generarle un link. Por defecto
   * "pendiente_verificacion" (el estado con el que siempre nace un pedido de editor). */
  estadoPago?: string;
}

// Reutiliza /api/checkout/mercadopago (la misma preferencia de Checkout Pro
// que usa el checkout público) para un pedido creado a mano por un admin o
// un editor. Genera el link una sola vez y lo deja listo para copiar y
// mandar por WhatsApp — no se regenera solo, porque cada preferencia nueva
// sería un link distinto y confundiría al cliente si ya le mandaron uno.
export function GenerarLinkPago({ pedidoId, formaPago, estadoPago = "pendiente_verificacion" }: GenerarLinkPagoProps) {
  const [link, setLink] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  if (formaPago !== "tarjeta" || estadoPago !== "pendiente_verificacion") return null;

  async function generar() {
    setGenerando(true);
    setError(null);
    const res = await fetch("/api/checkout/mercadopago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pedidoId }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.initPoint) {
      setError(data?.error ?? "No se pudo generar el link de pago.");
      setGenerando(false);
      return;
    }
    setLink(data.initPoint);
    setGenerando(false);
  }

  async function copiar() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  if (link) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Link de pago (Mercado Pago)</p>
        <div className="flex gap-2">
          <Input readOnly value={link} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
          <Button type="button" variant="outline" onClick={copiar}>
            {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiado ? "Copiado" : "Copiar"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Pásaselo al cliente — al pagar, el pedido se marca como pagado solo.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="outline" onClick={generar} disabled={generando}>
        <CreditCard className="h-4 w-4" />
        {generando ? "Generando…" : "Generar link de pago"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
