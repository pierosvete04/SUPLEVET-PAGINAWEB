import type { SupabaseClient } from "@supabase/supabase-js";

// Único lugar que decide cuánto se lleva cobrado de un pedido y qué estado de
// pago le corresponde.
//
// Existió un momento en que esto vivía en dos sitios —el diálogo de "pago
// parcial" escribía monto_pagado a mano, y la ruta de comprobantes lo
// recalculaba sumando el array— y se pisaban entre sí: un pedido quedaba con
// "Cobrado S/ 90" y un comprobante que decía S/ 179.90. Ahora monto_pagado es
// el dato mandante y los comprobantes solo lo suman o lo restan.

/** Redondeo a céntimos: los montos vienen de inputs de texto y sin esto la
 * suma arrastra decimales de coma flotante que dejan saldos de S/ 0.0000001. */
export function aCentimos(valor: unknown): number | null {
  const numero = typeof valor === "number" ? valor : Number(String(valor ?? "").replace(",", "."));
  if (!Number.isFinite(numero)) return null;
  return Math.round(numero * 100) / 100;
}

/** El estado se deriva de lo cobrado, nunca se recibe del cliente. Un pedido
 * rechazado o cancelado no se reabre por registrar un monto: eso se hace desde
 * los botones de estado de pago. */
export function estadoSegunCobrado(cobrado: number, total: number, estadoActual: string): string {
  if (estadoActual === "rechazado" || estadoActual === "cancelado") return estadoActual;
  if (cobrado <= 0) return "pendiente_verificacion";
  if (cobrado >= total) return "pagado";
  return "parcial";
}

export interface ResultadoCobro {
  estado_pago: string;
  monto_pagado: number;
  saldo_pendiente: number;
  /** Cobrado por encima del total: se avisa, no se bloquea. */
  sobrepago: number;
  /** El pedido pasó a pagado en esta operación (no lo estaba antes). */
  seCompleto: boolean;
}

interface PedidoCobro {
  total: number | string;
  estado_pago: string;
}

/**
 * Escribe el nuevo monto cobrado y el estado que le corresponde.
 * `extra` permite guardar de paso otros campos (los comprobantes, por ejemplo)
 * en el mismo UPDATE, para que nunca queden desfasados del monto.
 */
export async function aplicarCobro(
  supabase: SupabaseClient,
  pedidoId: string,
  pedido: PedidoCobro,
  cobrado: number,
  extra: Record<string, unknown> = {}
): Promise<{ error: string | null; resultado: ResultadoCobro }> {
  const total = Number(pedido.total);
  const montoFinal = Math.max(Math.round(cobrado * 100) / 100, 0);
  const estadoNuevo = estadoSegunCobrado(montoFinal, total, pedido.estado_pago);
  const seCompleto = estadoNuevo === "pagado" && pedido.estado_pago !== "pagado";

  const { error } = await supabase
    .from("pedidos")
    .update({
      ...extra,
      monto_pagado: montoFinal,
      estado_pago: estadoNuevo,
      ...(seCompleto ? { fecha_pago: new Date().toISOString() } : {}),
    })
    .eq("id", pedidoId);

  return {
    error: error?.message ?? null,
    resultado: {
      estado_pago: estadoNuevo,
      monto_pagado: montoFinal,
      saldo_pendiente: Math.max(Math.round((total - montoFinal) * 100) / 100, 0),
      sobrepago: montoFinal > total ? Math.round((montoFinal - total) * 100) / 100 : 0,
      seCompleto,
    },
  };
}
