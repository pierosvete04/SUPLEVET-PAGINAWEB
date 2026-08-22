import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notificarPedidoTelegram } from "@/lib/notificaciones/pedido-telegram";
import { acreditarPuntosPedido } from "@/lib/pedidos/acreditar-puntos";
import { aCentimos, aplicarCobro, sumarComprobantes } from "@/lib/pedidos/cobro";
import { MAX_COMPROBANTES, type ComprobantePago } from "@/lib/data/pedidos-admin";

// Pagos registrados de un pedido: hasta MAX_COMPROBANTES, cada uno con su
// monto y, si existe, su voucher. El caso real es el cliente que adelanta ~50%
// al hacer el pedido y paga el resto cuando Dinsides se lo entrega.
//
// Cada operación vuelve a sumar la lista completa; no se llevan ajustes
// relativos. Así lo que dice "Cobrado" siempre se puede verificar sumando lo
// que se ve en pantalla, que es como lo lee quien usa el panel.
//
// Va por API y no por UPDATE directo desde el navegador porque acá hay reglas
// que la RLS no puede garantizar: el estado de pago derivado del monto, y la
// acreditación de los SuplePoints que quedaron en pausa cuando un pedido se
// entregó con saldo.

function esUrlValida(valor: unknown): valor is string {
  return typeof valor === "string" && /^https?:\/\//.test(valor);
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
  const evento = resultado.seCompleto
    ? "pago_confirmado"
    : resultado.estado_pago === "parcial"
      ? "pago_parcial"
      : null;

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

/**
 * Registra un pago. La imagen es opcional: el cobro en efectivo en la puerta
 * no deja voucher, y a veces la captura llega horas después del pago. Lo que
 * no es opcional es el monto — de él sale el saldo que el rótulo le imprime
 * al motorizado.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const monto = aCentimos(body?.monto);
  if (monto === null || monto <= 0) {
    return NextResponse.json({ error: "Escribe cuánto se cobró en este pago." }, { status: 400 });
  }
  const url = esUrlValida(body?.url) ? body.url : null;

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
      { error: `Un pedido admite hasta ${MAX_COMPROBANTES} pagos registrados. Elimina uno para agregar otro.` },
      { status: 400 }
    );
  }

  const nota = typeof body?.nota === "string" && body.nota.trim() ? body.nota.trim().slice(0, 120) : null;
  const comprobantes: ComprobantePago[] = [
    ...previos,
    { url, monto, fecha: new Date().toISOString(), nota },
  ];

  const { error, resultado } = await aplicarCobro(
    supabase,
    id,
    pedido,
    sumarComprobantes(comprobantes),
    {
      comprobantes,
      // captura_pago_url apunta al primer voucher: es lo que leen el portal del
      // cliente y el aviso de Telegram, que muestran uno solo. Solo se escribe
      // si estaba vacía, para no pisar la original.
      ...(pedido.captura_pago_url || !url ? {} : { captura_pago_url: url }),
    }
  );

  if (error) return NextResponse.json({ error }, { status: 403 });

  const puntosAcreditados = await avisarYAcreditar(supabase, id, pedido, resultado);
  return NextResponse.json({ ok: true, ...resultado, puntos_acreditados: puntosAcreditados });
}

/** Corrige el monto de un pago ya registrado. Hace falta porque el monto puede
 * haberse tipeado mal, y porque los comprobantes anteriores a esta función se
 * migraron asumiendo que valían el total del pedido —cierto en un pago único,
 * falso en un pedido que se pagó en dos partes. */
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
    return NextResponse.json({ error: "Ese pago ya no existe." }, { status: 400 });
  }

  const comprobantes = previos.map((c, i) => (i === indice ? { ...c, monto } : c));
  const { error, resultado } = await aplicarCobro(
    supabase,
    id,
    pedido,
    sumarComprobantes(comprobantes),
    { comprobantes }
  );

  if (error) return NextResponse.json({ error }, { status: 403 });

  const puntosAcreditados = await avisarYAcreditar(supabase, id, pedido, resultado);
  return NextResponse.json({ ok: true, ...resultado, puntos_acreditados: puntosAcreditados });
}

/** Elimina un pago registrado. Lo cobrado vuelve a ser la suma de los que
 * quedan. */
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
    return NextResponse.json({ error: "Ese pago ya no existe." }, { status: 400 });
  }

  const comprobantes = previos.filter((_, i) => i !== indice);
  const { error, resultado } = await aplicarCobro(
    supabase,
    id,
    pedido,
    sumarComprobantes(comprobantes),
    {
      comprobantes,
      // Si se borró el que estaba de portada, la portada pasa al primer voucher
      // que quede (o a ninguno, si los que quedan son pagos sin imagen).
      captura_pago_url: comprobantes.find((c) => c.url)?.url ?? null,
    }
  );

  if (error) return NextResponse.json({ error }, { status: 403 });

  return NextResponse.json({ ok: true, ...resultado });
}
