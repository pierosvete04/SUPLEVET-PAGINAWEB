import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Cambiar la forma de pago de un pedido ya creado: el caso real es el cliente
// que pidió contra entrega y a último momento paga por transferencia o Yape.
// Va por ruta API en vez de un UPDATE directo desde el panel porque las reglas
// de abajo no las puede garantizar la RLS (que solo distingue admin de no
// admin). La autorización sigue siendo la misma política "Solo admin actualiza
// pedidos" -> is_admin(), acá no se duplica.

// Solo las formas que el equipo cobra a mano. "tarjeta" queda fuera a
// propósito: la preferencia de Mercado Pago nace atada al pedido en
// /api/checkout/mercadopago (que exige forma_pago === "tarjeta"), así que no se
// puede injertar después — y si el pago ya entró, lo confirmó el webhook contra
// una transacción real. "shopify" tampoco: esos pedidos son importados y su
// forma de pago es un dato histórico de la otra tienda.
const FORMAS_EDITABLES = ["yape_plin", "transferencia", "contra_entrega"] as const;
type FormaPago = (typeof FORMAS_EDITABLES)[number];

const FORMAS_BLOQUEADAS: Record<string, string> = {
  tarjeta:
    "Este pedido se pagó con tarjeta por Mercado Pago y ese pago se verifica solo. No se puede cambiar su método de pago.",
  shopify:
    "Este pedido viene importado del checkout de Shopify. Su método de pago es un dato histórico y no se edita.",
};

// Mismo criterio que /estado-pago: sin procesador que confirme el cobro, el
// comprobante es la única evidencia. Al pasar un pedido a estas formas hay que
// asegurarse de que exista, incluso si ya estaba marcado como pagado.
const FORMAS_QUE_EXIGEN_COMPROBANTE: string[] = ["yape_plin", "transferencia"];

function esFormaValida(valor: unknown): valor is FormaPago {
  return typeof valor === "string" && (FORMAS_EDITABLES as readonly string[]).includes(valor);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!esFormaValida(body?.forma_pago)) {
    return NextResponse.json({ error: "Método de pago inválido." }, { status: 400 });
  }
  const nueva: FormaPago = body.forma_pago;

  const supabase = await createClient();

  const { data: previo } = await supabase
    .from("pedidos")
    .select("forma_pago, estado_pago, captura_pago_url")
    .eq("id", id)
    .maybeSingle();

  if (!previo) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }

  const bloqueo = FORMAS_BLOQUEADAS[previo.forma_pago ?? ""];
  if (bloqueo) {
    return NextResponse.json({ error: bloqueo }, { status: 400 });
  }

  if (previo.estado_pago === "cancelado") {
    return NextResponse.json(
      { error: "Este pedido está cancelado. Reactívalo antes de cambiarle el método de pago." },
      { status: 400 }
    );
  }

  if (previo.forma_pago === nueva) {
    return NextResponse.json({ ok: true, sinCambios: true });
  }

  // Un pedido ya confirmado que pasa a Yape/transferencia sin comprobante
  // rompería la regla de /estado-pago (pagado ⇒ hay evidencia del cobro), así
  // que vuelve a pendiente de verificación. No se le avisa al cliente: para él
  // el pedido no cambió, es el equipo el que tiene que subir el comprobante y
  // volver a confirmar.
  const vuelveAPendiente =
    previo.estado_pago === "pagado" &&
    FORMAS_QUE_EXIGEN_COMPROBANTE.includes(nueva) &&
    !previo.captura_pago_url;

  const { error } = await supabase
    .from("pedidos")
    .update({
      forma_pago: nueva,
      ...(vuelveAPendiente ? { estado_pago: "pendiente_verificacion" } : {}),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    vuelveAPendiente,
    requiereComprobante: FORMAS_QUE_EXIGEN_COMPROBANTE.includes(nueva) && !previo.captura_pago_url,
  });
}
