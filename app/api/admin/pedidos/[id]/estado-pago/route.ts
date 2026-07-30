import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/emails/send";
import { siteConfig, whatsappLink } from "@/lib/site-config";

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
  const estado = body.estado;

  const supabase = await createClient();

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
    .select("cliente_email, cliente_nombre, shopify_order_number")
    .maybeSingle();

  if (error || !pedido) {
    return NextResponse.json(
      { error: error?.message ?? "No autorizado o pedido no encontrado" },
      { status: 403 }
    );
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

  let sendError: string | null;

  if (estado === "pagado") {
    // El cliente escribe primero (en vez de que el negocio le escriba), así la
    // conversación de WhatsApp Business entra como iniciada por el usuario.
    const whatsappUrlConfirmado = whatsappLink(
      siteConfig.whatsappB2C,
      `Hola, soy ${nombre}. Mi pedido ${numeroPedido} ya fue confirmado, ¿cuándo me lo traen?`
    );
    ({ error: sendError } = await sendTransactionalEmail(pedido.cliente_email, {
      tipo: "pago_confirmado",
      data: {
        nombre,
        numeroPedido,
        puntosGanados: 0,
        whatsappUrl: whatsappUrlConfirmado,
      },
    }));
  } else if (estado === "rechazado") {
    ({ error: sendError } = await sendTransactionalEmail(pedido.cliente_email, {
      tipo: "pago_error",
      data: {
        nombre,
        numeroPedido,
        motivo: "no pudimos validar tu comprobante de pago",
        whatsappUrl: whatsappUrlProblema,
      },
    }));
  } else {
    ({ error: sendError } = await sendTransactionalEmail(pedido.cliente_email, {
      tipo: "pago_cancelado",
      data: {
        nombre,
        numeroPedido,
        motivo: "no pudimos completar el proceso de compra",
        whatsappUrl: whatsappUrlProblema,
      },
    }));
  }

  if (sendError) {
    console.error("No se pudo enviar el correo de estado de pago:", sendError);
  }

  return NextResponse.json({ ok: true });
}
