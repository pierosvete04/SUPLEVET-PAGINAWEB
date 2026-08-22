import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/emails/send";
import { notificarPedidoTelegram } from "@/lib/notificaciones/pedido-telegram";
import { whatsappPedido } from "@/lib/whatsapp-mensajes";

// Llamado por el botón Confirmar/Rechazar de app/admin/(panel)/pedidos/[id] en
// vez del UPDATE directo desde el cliente — así el correo de resultado
// (pago_confirmado / pago_error) se puede mandar server-side sin exponer
// RESEND_API_KEY al navegador del admin. El UPDATE en sí lo sigue autorizando
// la misma RLS de siempre ("Solo admin actualiza pedidos" -> is_admin()); acá
// no se duplica esa verificación, se reutiliza la política.
const ESTADOS_VALIDOS = ["pagado", "rechazado", "cancelado"] as const;
type EstadoPago = (typeof ESTADOS_VALIDOS)[number];

function esEstadoValido(valor: unknown): valor is EstadoPago {
  return typeof valor === "string" && (ESTADOS_VALIDOS as readonly string[]).includes(valor);
}

// Yape/Plin y transferencia no tienen procesador que confirme el pago solo
// (a diferencia de tarjeta vía Mercado Pago), así que el comprobante subido
// por el admin es la única evidencia real del pago — se exige antes de
// aceptar el "pagado", aunque el panel ya bloquee el botón del lado cliente.
const FORMAS_QUE_EXIGEN_COMPROBANTE = ["yape_plin", "transferencia"];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!esEstadoValido(body?.estado)) {
    return NextResponse.json({ error: "estado inválido" }, { status: 400 });
  }
  const estado: EstadoPago = body.estado;
  // Toggle "avisar al cliente" del panel (como el de Shopify): por defecto se
  // manda el correo, pero el admin puede destildarlo cuando el cambio es una
  // corrección propia (ej. se equivocó de botón) y no algo que el cliente
  // necesite saber. El aviso interno de Telegram no depende de esto.
  const notificar = body?.notificar !== false;

  const supabase = await createClient();

  // "parcial" no se escribe acá: el monto cobrado tiene un único dueño, la
  // ruta /monto-cobrado (ver lib/pedidos/cobro). Marcar el estado sin el monto
  // dejaba pedidos "parciales" sin saber cuánto falta, que es justo el dato
  // que el rótulo necesita.
  if (estado === "pagado") {
    const { data: previo } = await supabase
      .from("pedidos")
      .select("forma_pago, captura_pago_url")
      .eq("id", id)
      .maybeSingle();
    if (
      FORMAS_QUE_EXIGEN_COMPROBANTE.includes(previo?.forma_pago ?? "") &&
      !previo?.captura_pago_url
    ) {
      return NextResponse.json(
        { error: "Adjunta el comprobante de pago antes de confirmar." },
        { status: 400 }
      );
    }
  }

  const { data: pedido, error } = await supabase
    .from("pedidos")
    .update({ estado_pago: estado })
    .eq("id", id)
    .select("cliente_email, cliente_nombre, numero_pedido")
    .maybeSingle();

  if (error || !pedido) {
    return NextResponse.json(
      { error: error?.message ?? "No autorizado o pedido no encontrado" },
      { status: 403 }
    );
  }

  // Antes del early-return por falta de correo: el equipo igual quiere el aviso
  // aunque el pedido no tenga email al que responderle.
  const EVENTO_TELEGRAM = {
    pagado: "pago_confirmado",
    rechazado: "pago_rechazado",
    cancelado: "pago_cancelado",
  } as const;
  const { error: telegramError } = await notificarPedidoTelegram(EVENTO_TELEGRAM[estado], id);
  if (telegramError) {
    console.error("No se pudo enviar el aviso de Telegram del estado de pago:", telegramError);
  }

  if (!pedido.cliente_email || !notificar) {
    return NextResponse.json({ ok: true });
  }

  const numeroPedido = pedido.numero_pedido ?? "";
  const nombre = pedido.cliente_nombre ?? "cliente";
  let sendError: string | null;

  if (estado === "pagado") {
    // El cliente escribe primero (en vez de que el negocio le escriba), así la
    // conversación de WhatsApp Business entra como iniciada por el usuario.
    ({ error: sendError } = await sendTransactionalEmail(pedido.cliente_email, {
      tipo: "pago_confirmado",
      data: {
        nombre,
        numeroPedido,
        puntosGanados: 0,
        whatsappUrl: whatsappPedido("coordinarEntrega", { nombre, numeroPedido }),
      },
    }));
  } else if (estado === "rechazado") {
    const motivo = "no pudimos validar tu comprobante de pago";
    ({ error: sendError } = await sendTransactionalEmail(pedido.cliente_email, {
      tipo: "pago_error",
      data: {
        nombre,
        numeroPedido,
        motivo,
        whatsappUrl: whatsappPedido("problemaPago", { nombre, numeroPedido, motivo }),
      },
    }));
  } else {
    const motivo = "no pudimos completar el proceso de compra";
    ({ error: sendError } = await sendTransactionalEmail(pedido.cliente_email, {
      tipo: "pago_cancelado",
      data: {
        nombre,
        numeroPedido,
        motivo,
        whatsappUrl: whatsappPedido("pedidoCancelado", { nombre, numeroPedido, motivo }),
      },
    }));
  }

  if (sendError) {
    console.error("No se pudo enviar el correo de estado de pago:", sendError);
  }

  return NextResponse.json({ ok: true });
}
