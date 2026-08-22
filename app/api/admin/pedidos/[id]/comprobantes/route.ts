import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notificarPedidoTelegram } from "@/lib/notificaciones/pedido-telegram";
import { acreditarPuntosPedido } from "@/lib/pedidos/acreditar-puntos";
import { aCentimos, aplicarCobro } from "@/lib/pedidos/cobro";
import { MAX_COMPROBANTES, type ComprobantePago } from "@/lib/data/pedidos-admin";

// Comprobantes de un pedido: hasta MAX_COMPROBANTES, cada uno con su monto.
// El caso real es el cliente que adelanta ~50% al hacer el pedido y paga el
// resto cuando Dinsides se lo entrega.
//
// Cada comprobante SUMA (o resta, al borrarlo) sobre lo ya cobrado; no se
// recalcula el total como la suma del array. Esa diferencia importa: el monto
// cobrado también se puede ajustar a mano (pagos en efectivo sin voucher,
// correcciones), y recalcular desde el array borraba esos ajustes sin avisar.
//
// Va por API y no por UPDATE directo desde el navegador porque acá hay reglas
// que la RLS no puede garantizar: el estado de pago derivado del monto, y la
// acreditación de los SuplePoints que quedaron en pausa cuando un pedido se
// entregó con saldo.

interface CuerpoAlta {
  url?: unknown;
  monto?: unknown;
  nota?: unknown;
}

function esUrlValida(valor: unknown): valor is string {
  return typeof valor === "string" && /^https?:\/\//.test(valor);
}

async function leerPedido(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  return supabase
    .from("pedidos")
    .select(
      "id, total, estado_pago, estado_preparacion, monto_pagado, comprobantes, captura_pago_url, cliente_email, cliente_nombre, numero_pedido"
    )
    .eq("id", id)
    .maybeSingle();
}

/** Avisos posteriores a un cobro: Telegram siempre, y los SuplePoints solo si
 * el pedido ya se entregó (quedaron en pausa esperando el saldo). */
async function avisarYAcreditar(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  pedido: {
    estado_preparacion: string;
    cliente_email: string | null;
    cliente_nombre: string | null;
    numero_pedido: string | null;
  },
  resultado: { estado_pago: string; seCompleto: boolean }
): Promise<boolean> {
  const evento =
    resultado.seCompleto ? "pago_confirmado" : resultado.estado_pago === "parcial" ? "pago_parcial" : null;

  if (evento) {
    const { error } = await notificarPedidoTelegram(evento, id);
    if (error) console.error("No se pudo enviar el aviso de Telegram del cobro:", error);
  }

  if (resultado.seCompleto && pedido.estado_preparacion === "entregado") {
    const puntos = await acreditarPuntosPedido(supabase, id, pedido, true);
    return puntos.acreditados;
  }
  return false;
}

/** Agrega un comprobante (imagen + monto cobrado en ese pago). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as CuerpoAlta | null;

  if (!esUrlValida(body?.url)) {
    return NextResponse.json({ error: "Falta la imagen del comprobante." }, { status: 400 });
  }
  const monto = aCentimos(body?.monto);
  if (monto === null || monto <= 0) {
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

  const nota = typeof body?.nota === "string" && body.nota.trim() ? body.nota.trim().slice(0, 120) : null;
  const comprobantes: ComprobantePago[] = [
    ...previos,
    { url: body.url, monto, fecha: new Date().toISOString(), nota },
  ];

  const { error, resultado } = await aplicarCobro(
    supabase,
    id,
    pedido,
    Number(pedido.monto_pagado ?? 0) + monto,
    {
      comprobantes,
      // captura_pago_url apunta al primer comprobante: es lo que leen el portal
      // del cliente y el aviso de Telegram, que muestran uno solo. Solo se
      // escribe si estaba vacía, para no pisar la original.
      ...(pedido.captura_pago_url ? {} : { captura_pago_url: body.url }),
    }
  );

  if (error) return NextResponse.json({ error }, { status: 403 });

  const puntosAcreditados = await avisarYAcreditar(supabase, id, pedido, resultado);
  return NextResponse.json({ ok: true, ...resultado, puntos_acreditados: puntosAcreditados });
}

/** Corrige el monto de un comprobante ya registrado. Hace falta porque el
 * monto puede haberse tipeado mal, y porque los comprobantes que existían
 * antes de esta función se migraron asumiendo que valían el total del pedido
 * —cierto en un pago único, falso en un pedido que se pagó en dos partes. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { indice?: unknown; monto?: unknown } | null;

  const indice = Number(body?.indice);
  const monto = aCentimos(body?.monto);
  if (!Number.isInteger(indice) || indice < 0) {
    return NextResponse.json({ error: "indice inválido" }, { status: 400 });
  }
  if (monto === null || monto <= 0) {
    return NextResponse.json({ error: "Escribe un monto mayor que 0." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: pedido } = await leerPedido(supabase, id);
  if (!pedido) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  const previos = (pedido.comprobantes ?? []) as ComprobantePago[];
  if (indice >= previos.length) {
    return NextResponse.json({ error: "Ese comprobante ya no existe." }, { status: 400 });
  }

  const anterior = Number(previos[indice].monto ?? 0);
  const comprobantes = previos.map((c, i) => (i === indice ? { ...c, monto } : c));

  const { error, resultado } = await aplicarCobro(
    supabase,
    id,
    pedido,
    Number(pedido.monto_pagado ?? 0) - anterior + monto,
    { comprobantes }
  );

  if (error) return NextResponse.json({ error }, { status: 403 });

  const puntosAcreditados = await avisarYAcreditar(supabase, id, pedido, resultado);
  return NextResponse.json({ ok: true, ...resultado, puntos_acreditados: puntosAcreditados });
}

/** Elimina un comprobante por su posición y descuenta su monto de lo cobrado. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const indice = Number(new URL(request.url).searchParams.get("indice"));

  if (!Number.isInteger(indice) || indice < 0) {
    return NextResponse.json({ error: "indice inválido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: pedido } = await leerPedido(supabase, id);
  if (!pedido) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  const previos = (pedido.comprobantes ?? []) as ComprobantePago[];
  if (indice >= previos.length) {
    return NextResponse.json({ error: "Ese comprobante ya no existe." }, { status: 400 });
  }

  const comprobantes = previos.filter((_, i) => i !== indice);
  const { error, resultado } = await aplicarCobro(
    supabase,
    id,
    pedido,
    Number(pedido.monto_pagado ?? 0) - Number(previos[indice].monto ?? 0),
    {
      comprobantes,
      // Si se borró el que estaba de portada, la portada pasa a ser el primero
      // que quede (o ninguna).
      captura_pago_url: comprobantes[0]?.url ?? null,
    }
  );

  if (error) return NextResponse.json({ error }, { status: 403 });

  return NextResponse.json({ ok: true, ...resultado });
}
