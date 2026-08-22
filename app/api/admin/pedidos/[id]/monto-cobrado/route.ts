import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notificarPedidoTelegram } from "@/lib/notificaciones/pedido-telegram";
import { acreditarPuntosPedido } from "@/lib/pedidos/acreditar-puntos";
import { aCentimos, aplicarCobro } from "@/lib/pedidos/cobro";

// Fija cuánto se lleva cobrado de un pedido, sin pasar por un comprobante.
// Hace falta para los cobros que no dejan voucher (efectivo en la puerta, el
// adelanto que el cliente avisa por WhatsApp antes de mandar la captura) y
// para corregir un monto mal escrito. El estado de pago sale del monto, no se
// elige: 0 es pendiente, menos que el total es parcial, y el total es pagado.

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const monto = aCentimos(body?.monto_pagado);
  if (monto === null || monto < 0) {
    return NextResponse.json({ error: "Escribe cuánto se ha cobrado hasta ahora." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: pedido } = await supabase
    .from("pedidos")
    .select(
      "total, estado_pago, estado_preparacion, cliente_email, cliente_nombre, numero_pedido"
    )
    .eq("id", id)
    .maybeSingle();

  if (!pedido) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }
  if (pedido.estado_pago === "cancelado") {
    return NextResponse.json(
      { error: "Este pedido está cancelado: no se le pueden registrar pagos." },
      { status: 400 }
    );
  }

  const { error, resultado } = await aplicarCobro(supabase, id, pedido, monto);
  if (error) return NextResponse.json({ error }, { status: 403 });

  const evento =
    resultado.seCompleto ? "pago_confirmado" : resultado.estado_pago === "parcial" ? "pago_parcial" : null;
  if (evento) {
    const { error: telegramError } = await notificarPedidoTelegram(evento, id);
    if (telegramError) {
      console.error("No se pudo enviar el aviso de Telegram del cobro:", telegramError);
    }
  }

  // Sin correo al cliente: no hay plantilla de "pago parcial", y cuando el
  // pedido se completa desde acá el aviso útil (el saldo que queda) ya se le
  // da al coordinar la entrega por WhatsApp, con el monto exacto.
  let puntosAcreditados = false;
  if (resultado.seCompleto && pedido.estado_preparacion === "entregado") {
    const puntos = await acreditarPuntosPedido(supabase, id, pedido, true);
    puntosAcreditados = puntos.acreditados;
  }

  return NextResponse.json({ ok: true, ...resultado, puntos_acreditados: puntosAcreditados });
}
