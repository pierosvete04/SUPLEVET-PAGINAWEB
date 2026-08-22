import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notificarPedidoTelegram } from "@/lib/notificaciones/pedido-telegram";
import { acreditarPuntosPedido } from "@/lib/pedidos/acreditar-puntos";
import { MAX_COMPROBANTES, type ComprobantePago } from "@/lib/data/pedidos-admin";

// Registro de pagos de un pedido. Existe porque el caso real no es "un pago,
// un comprobante": muchos clientes adelantan el 50% al hacer el pedido y
// pagan el resto cuando Dinsides se los entrega, así que un pedido puede
// tener hasta MAX_COMPROBANTES pagos, cada uno con su monto.
//
// Va por API y no por UPDATE directo desde el navegador (como sí hace el
// resto del panel) porque acá hay tres cosas que la RLS no puede garantizar:
// que monto_pagado sea exactamente la suma de los comprobantes, que el estado
// de pago se derive de esa suma, y que al completarse el saldo de un pedido ya
// entregado se acrediten los SuplePoints que quedaron en pausa.

interface ComprobanteEntrada {
  url?: unknown;
  monto?: unknown;
  nota?: unknown;
}

function esUrlValida(valor: unknown): valor is string {
  return typeof valor === "string" && /^https?:\/\//.test(valor);
}

/** Los montos vienen de un input de texto: se redondean a céntimos para que
 * la suma no arrastre decimales de coma flotante y quede, por ejemplo, un
 * saldo de S/ 0.0000001 que deja el pedido eternamente "parcial". */
function aCentimos(valor: unknown): number | null {
  const numero = typeof valor === "number" ? valor : Number(String(valor ?? "").replace(",", "."));
  if (!Number.isFinite(numero) || numero <= 0) return null;
  return Math.round(numero * 100) / 100;
}

function sumar(comprobantes: ComprobantePago[]): number {
  return Math.round(comprobantes.reduce((acc, c) => acc + Number(c.monto ?? 0), 0) * 100) / 100;
}

/** El estado se deriva de lo cobrado, nunca se recibe del cliente: sin
 * comprobantes sigue pendiente, con parte del total es parcial, y completo es
 * pagado. Un pedido rechazado o cancelado no se reabre por subir un
 * comprobante — eso se hace desde los botones de estado de pago. */
function estadoSegunCobrado(cobrado: number, total: number, estadoActual: string): string {
  if (estadoActual === "rechazado" || estadoActual === "cancelado") return estadoActual;
  if (cobrado <= 0) return "pendiente_verificacion";
  if (cobrado >= total) return "pagado";
  return "parcial";
}

async function leerPedido(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  return supabase
    .from("pedidos")
    .select(
      "id, total, estado_pago, estado_preparacion, comprobantes, captura_pago_url, cliente_email, cliente_nombre, numero_pedido"
    )
    .eq("id", id)
    .maybeSingle();
}

/** Agrega un comprobante (imagen + monto cobrado). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as ComprobanteEntrada | null;

  if (!esUrlValida(body?.url)) {
    return NextResponse.json({ error: "Falta la imagen del comprobante." }, { status: 400 });
  }
  const monto = aCentimos(body?.monto);
  if (monto === null) {
    return NextResponse.json({ error: "Escribe cuánto se cobró en este pago." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: pedido } = await leerPedido(supabase, id);
  if (!pedido) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }
  if (pedido.estado_pago === "cancelado") {
    return NextResponse.json(
      { error: "Este pedido está cancelado: no se le pueden registrar pagos." },
      { status: 400 }
    );
  }

  const previos = (pedido.comprobantes ?? []) as ComprobantePago[];
  if (previos.length >= MAX_COMPROBANTES) {
    return NextResponse.json(
      { error: `Un pedido admite hasta ${MAX_COMPROBANTES} comprobantes. Elimina uno para agregar otro.` },
      { status: 400 }
    );
  }

  const total = Number(pedido.total);
  const nota = typeof body?.nota === "string" && body.nota.trim() ? body.nota.trim().slice(0, 120) : null;
  const comprobantes: ComprobantePago[] = [
    ...previos,
    { url: body.url, monto, fecha: new Date().toISOString(), nota },
  ];
  const cobrado = sumar(comprobantes);

  // Se avisa pero no se bloquea: cobrar de más pasa (el cliente redondea, o
  // paga el envío aparte) y trabar el registro obligaría al equipo a escribir
  // un monto falso para poder guardarlo.
  const sobrepago = cobrado > total ? Math.round((cobrado - total) * 100) / 100 : 0;
  const estadoNuevo = estadoSegunCobrado(cobrado, total, pedido.estado_pago);
  const estabaPagado = pedido.estado_pago === "pagado";

  const { error } = await supabase
    .from("pedidos")
    .update({
      comprobantes,
      monto_pagado: cobrado,
      estado_pago: estadoNuevo,
      // captura_pago_url sigue apuntando al primer comprobante: es lo que
      // leen el portal del cliente y el aviso de Telegram, que muestran uno
      // solo. Se escribe únicamente si estaba vacía, para no pisar la original.
      ...(pedido.captura_pago_url ? {} : { captura_pago_url: body.url }),
      ...(estadoNuevo === "pagado" && !estabaPagado ? { fecha_pago: new Date().toISOString() } : {}),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  // El aviso a Telegram es el que usa el equipo para saber que hay plata
  // entrando; el parcial también interesa, porque deja el saldo por cobrar
  // anotado en el grupo antes de que salga el paquete.
  if (estadoNuevo === "pagado" && !estabaPagado) {
    const { error: telegramError } = await notificarPedidoTelegram("pago_confirmado", id);
    if (telegramError) {
      console.error("No se pudo enviar el aviso de Telegram del pago completado:", telegramError);
    }
  } else if (estadoNuevo === "parcial") {
    const { error: telegramError } = await notificarPedidoTelegram("pago_parcial", id);
    if (telegramError) {
      console.error("No se pudo enviar el aviso de Telegram del pago parcial:", telegramError);
    }
  }

  // El pedido que ya se entregó con saldo pendiente tiene los SuplePoints en
  // pausa (ver acreditar_puntos_pedido_web): al completarse el cobro es acá
  // donde se sueltan, porque nadie va a volver a tocar el estado de entrega.
  let puntosAcreditados = false;
  if (estadoNuevo === "pagado" && pedido.estado_preparacion === "entregado") {
    const resultado = await acreditarPuntosPedido(supabase, id, pedido, true);
    puntosAcreditados = resultado.acreditados;
  }

  return NextResponse.json({
    ok: true,
    estado_pago: estadoNuevo,
    monto_pagado: cobrado,
    saldo_pendiente: Math.max(total - cobrado, 0),
    sobrepago,
    puntos_acreditados: puntosAcreditados,
  });
}

/** Elimina un comprobante por su posición. Para el caso de la captura subida
 * al pedido equivocado o el monto tipeado mal (se borra y se vuelve a
 * registrar); el estado de pago se recalcula solo. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const indice = Number(new URL(request.url).searchParams.get("indice"));

  if (!Number.isInteger(indice) || indice < 0) {
    return NextResponse.json({ error: "indice inválido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: pedido } = await leerPedido(supabase, id);
  if (!pedido) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const previos = (pedido.comprobantes ?? []) as ComprobantePago[];
  if (indice >= previos.length) {
    return NextResponse.json({ error: "Ese comprobante ya no existe." }, { status: 400 });
  }

  const comprobantes = previos.filter((_, i) => i !== indice);
  const cobrado = sumar(comprobantes);
  const estadoNuevo = estadoSegunCobrado(cobrado, Number(pedido.total), pedido.estado_pago);

  const { error } = await supabase
    .from("pedidos")
    .update({
      comprobantes,
      monto_pagado: cobrado,
      estado_pago: estadoNuevo,
      // Si se borró el que estaba de portada, la portada pasa a ser el
      // primero que quede (o ninguna).
      captura_pago_url: comprobantes[0]?.url ?? null,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    estado_pago: estadoNuevo,
    monto_pagado: cobrado,
    saldo_pendiente: Math.max(Number(pedido.total) - cobrado, 0),
  });
}
