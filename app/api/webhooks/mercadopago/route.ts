import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMercadoPagoPaymentClient } from "@/lib/mercadopago";
import { sendTransactionalEmail } from "@/lib/emails/send";
import { siteConfig, whatsappLink } from "@/lib/site-config";

// Mercado Pago llama a esta URL (configurada como notification_url en la
// preferencia, ver app/api/checkout/mercadopago) cada vez que un pago cambia
// de estado. Es la única fuente de verdad sobre si un pago con tarjeta se
// aprobó o no — el back_url al que MP redirige al navegador puede llegar
// antes que este webhook, así que /checkout/exito relee el pedido de la BD
// en vez de asumir éxito solo por haber vuelto del checkout.
//
// No hay sesión de usuario en esta request (la llama el servidor de Mercado
// Pago, no un cliente logueado), así que el UPDATE usa el cliente con
// Service Role — la RLS "Solo admin actualiza pedidos" bloquearía esto con
// el cliente normal.

type EstadoPago = "pagado" | "rechazado" | "cancelado" | "pendiente_verificacion";

const ESTADO_POR_STATUS: Record<string, EstadoPago> = {
  approved: "pagado",
  rejected: "rechazado",
  cancelled: "cancelado",
  refunded: "cancelado",
  charged_back: "cancelado",
  in_process: "pendiente_verificacion",
  pending: "pendiente_verificacion",
};

function firmaValida(request: Request, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return true; // sin clave configurada, no se puede validar — se procesa igual.

  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (!signatureHeader || !requestId) return false;

  const partes = Object.fromEntries(
    signatureHeader.split(",").map((parte) => {
      const [clave, valor] = parte.split("=").map((s) => s.trim());
      return [clave, valor];
    })
  );
  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const hmacEsperado = createHmac("sha256", secret).update(manifest).digest("hex");

  const bufferEsperado = Buffer.from(hmacEsperado, "hex");
  const bufferRecibido = Buffer.from(v1, "hex");
  if (bufferEsperado.length !== bufferRecibido.length) return false;
  return timingSafeEqual(bufferEsperado, bufferRecibido);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const tipo = url.searchParams.get("type") ?? url.searchParams.get("topic");
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  // Solo nos interesan las notificaciones de pago — merchant_order y otras
  // no traen un estado de pago accionable acá.
  if (tipo !== "payment" || !dataId) {
    return NextResponse.json({ ok: true });
  }

  if (!firmaValida(request, dataId)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let pagoStatus: string;
  let pedidoId: string | null | undefined;
  try {
    const pago = await getMercadoPagoPaymentClient().get({ id: dataId });
    pagoStatus = pago.status ?? "";
    pedidoId = pago.external_reference;
  } catch (mpError) {
    console.error("Error consultando el pago en Mercado Pago:", mpError);
    return NextResponse.json({ error: "No se pudo consultar el pago" }, { status: 502 });
  }

  const nuevoEstado = ESTADO_POR_STATUS[pagoStatus];
  if (!nuevoEstado || !pedidoId) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminClient();
  const { data: pedido, error } = await supabase
    .from("pedidos")
    .select("cliente_email, cliente_nombre, shopify_order_number, estado_pago")
    .eq("id", pedidoId)
    .maybeSingle();

  if (error) {
    console.error("Error leyendo el pedido para el webhook de Mercado Pago:", error);
    return NextResponse.json({ error: "Error de base de datos" }, { status: 500 });
  }
  // Pedido inexistente (ej. notificación de prueba de otro entorno) o ya
  // procesado con este mismo estado (MP reintenta notificaciones) — no hay
  // nada que actualizar ni correo que reenviar.
  if (!pedido || pedido.estado_pago === nuevoEstado) {
    return NextResponse.json({ ok: true });
  }

  const { error: updateError } = await supabase
    .from("pedidos")
    .update({ estado_pago: nuevoEstado })
    .eq("id", pedidoId);

  if (updateError) {
    console.error("Error actualizando el pedido desde el webhook de Mercado Pago:", updateError);
    return NextResponse.json({ error: "Error de base de datos" }, { status: 500 });
  }

  if (!pedido.cliente_email) {
    return NextResponse.json({ ok: true });
  }

  const numeroPedido = pedido.shopify_order_number ?? "";
  const nombre = pedido.cliente_nombre ?? "cliente";
  const whatsappUrlProblema = whatsappLink(
    siteConfig.whatsappB2C,
    `Hola, tuve un problema con el pago de mi pedido ${numeroPedido}`
  );

  let sendError: string | null = null;

  if (nuevoEstado === "pagado") {
    const whatsappUrlConfirmado = whatsappLink(
      siteConfig.whatsappB2C,
      `Hola, soy ${nombre}. Mi pedido ${numeroPedido} ya fue confirmado, ¿cuándo me lo traen?`
    );
    ({ error: sendError } = await sendTransactionalEmail(pedido.cliente_email, {
      tipo: "pago_confirmado",
      data: { nombre, numeroPedido, puntosGanados: 0, whatsappUrl: whatsappUrlConfirmado },
    }));
  } else if (nuevoEstado === "rechazado") {
    ({ error: sendError } = await sendTransactionalEmail(pedido.cliente_email, {
      tipo: "pago_error",
      data: {
        nombre,
        numeroPedido,
        motivo: "tu tarjeta fue rechazada por el banco o el procesador de pagos",
        whatsappUrl: whatsappUrlProblema,
      },
    }));
  } else if (nuevoEstado === "cancelado") {
    ({ error: sendError } = await sendTransactionalEmail(pedido.cliente_email, {
      tipo: "pago_cancelado",
      data: { nombre, numeroPedido, motivo: "no pudimos completar el proceso de pago", whatsappUrl: whatsappUrlProblema },
    }));
  }

  if (sendError) {
    console.error("No se pudo enviar el correo de resultado de pago:", sendError);
  }

  return NextResponse.json({ ok: true });
}
