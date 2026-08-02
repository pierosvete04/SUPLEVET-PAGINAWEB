import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMercadoPagoPaymentClient } from "@/lib/mercadopago";
import { sendTransactionalEmail } from "@/lib/emails/send";
import { notificarEquipoVentas } from "@/lib/emails/notificar-ventas";
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

// Mercado Pago maneja una clave secreta distinta por modo (prueba y
// productivo) y firma cada notificación con la del modo en que se generó el
// pago. Los pagos hechos con usuarios de prueba llegan con `live_mode: true`
// y vienen firmados con la clave PRODUCTIVA, no con la de prueba — verificado
// el 2026-08-02 comparando el HMAC calculado contra el `v1` recibido: con la
// clave de la pestaña "Prueba" ninguna variante del manifest coincidía. Por
// eso se aceptan las dos claves si están configuradas.
function secretsWebhook(): string[] {
  return [process.env.MERCADOPAGO_WEBHOOK_SECRET, process.env.MERCADOPAGO_WEBHOOK_SECRET_PROD]
    .map((secret) => secret?.trim())
    .filter((secret): secret is string => Boolean(secret));
}

function firmaValida(request: Request, dataId: string): boolean {
  const secrets = secretsWebhook();
  if (secrets.length === 0) return true; // sin clave configurada, no se puede validar.

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
  const bufferRecibido = Buffer.from(v1, "hex");

  return secrets.some((secret) => {
    const hmac = createHmac("sha256", secret).update(manifest).digest("hex");
    const bufferEsperado = Buffer.from(hmac, "hex");
    if (bufferEsperado.length !== bufferRecibido.length) return false;
    return timingSafeEqual(bufferEsperado, bufferRecibido);
  });
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

  // La firma es defensa en profundidad, no el control principal: abajo el pago
  // se relee de la API de Mercado Pago con nuestro access token, y tanto el
  // estado como el external_reference salen de ESA respuesta, nunca del cuerpo
  // de la request. Así, una notificación no firmada solo puede provocar que un
  // pedido se sincronice a su estado real en MP — no puede marcar como pagado
  // algo que MP no aprobó. Rechazar con 401 acá dejaba pedidos ya cobrados
  // colgados en "pendiente_verificacion" cuando la clave del modo no calzaba,
  // así que se registra el fallo (para poder corregir la clave) y se continúa.
  if (!firmaValida(request, dataId)) {
    console.warn("[MP webhook] Firma inválida; se verifica el pago contra la API de Mercado Pago.", {
      dataId,
      secretsConfigurados: secretsWebhook().length,
    });
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
  // UPDATE condicional en una sola consulta, en vez de leer el estado y
  // después escribirlo: Mercado Pago manda varias notificaciones del mismo
  // pago casi a la vez (el 2026-08-02 llegaron dos en el mismo segundo) y con
  // el chequeo previo ambas lo veían todavía en "pendiente_verificacion",
  // así que las dos actualizaban y las dos mandaban el correo de confirmación
  // — el cliente recibía el mismo mensaje duplicado. Al poner la condición
  // dentro del propio UPDATE, Postgres la re-evalúa después de tomar el lock
  // de la fila, así que solo una invocación se lleva la transición y la otra
  // afecta 0 filas. El `is.null` está porque en SQL `columna <> 'x'` es NULL
  // (no true) cuando la columna es NULL, y esa fila quedaría sin actualizar.
  const { data: actualizados, error: updateError } = await supabase
    .from("pedidos")
    .update({ estado_pago: nuevoEstado })
    .eq("id", pedidoId)
    .or(`estado_pago.is.null,estado_pago.neq.${nuevoEstado}`)
    .select("cliente_email, cliente_nombre, cliente_telefono, shopify_order_number, total");

  if (updateError) {
    console.error("Error actualizando el pedido desde el webhook de Mercado Pago:", updateError);
    return NextResponse.json({ error: "Error de base de datos" }, { status: 500 });
  }

  // Sin filas: o el pedido no existe (ej. notificación de otro entorno), o
  // otra notificación del mismo pago ya hizo esta misma transición. En ambos
  // casos no hay nada que avisar.
  const pedido = actualizados?.[0];
  if (!pedido || !pedido.cliente_email) {
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

  // Este webhook solo dispara para pagos con tarjeta (ver comentario de
  // arriba), así que el método de pago siempre es "Tarjeta" acá.
  const EVENTO_POR_ESTADO = {
    pagado: "pago_confirmado",
    rechazado: "pago_rechazado",
    cancelado: "pago_cancelado",
  } as const;
  const evento = EVENTO_POR_ESTADO[nuevoEstado as keyof typeof EVENTO_POR_ESTADO];
  if (evento) {
    const { error: notifyError } = await notificarEquipoVentas(evento, {
      pedidoId,
      numeroPedido,
      clienteNombre: nombre,
      clienteEmail: pedido.cliente_email,
      clienteTelefono: pedido.cliente_telefono,
      metodoPago: "Tarjeta",
      total: pedido.total ?? 0,
    });
    if (notifyError) {
      console.error("No se pudo notificar al equipo de ventas del cambio de pago:", notifyError);
    }
  }

  return NextResponse.json({ ok: true });
}
