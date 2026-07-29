import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/emails/send";
import { notificarEquipoVentas } from "@/lib/emails/notificar-ventas";
import type { PagoEnVerificacionProps } from "@/emails/pago-en-verificacion";
import { siteConfig, whatsappLink } from "@/lib/site-config";

// Llamado por app/checkout/page.tsx justo después de registrar_pedido_web().
// Server-only a propósito: RESEND_API_KEY nunca debe llegar al bundle del
// cliente, así que el correo se arma y se manda desde acá, no desde el
// navegador. El pedido se relee de la BD (no se confía en lo que mande el
// cliente) — la RLS "Cliente ve sus pedidos" ya garantiza que solo el dueño
// del pedido (o un admin) puede leerlo.
const METODO_PAGO_LABEL: Record<string, PagoEnVerificacionProps["metodoPago"]> = {
  yape_plin: "Yape",
  transferencia: "transferencia",
  tarjeta: "tarjeta",
  contra_entrega: "contra entrega",
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const pedidoId = body?.pedidoId;
  if (typeof pedidoId !== "string" || !pedidoId) {
    return NextResponse.json({ error: "pedidoId requerido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: pedido, error } = await supabase
    .from("pedidos")
    .select("cliente_email, cliente_nombre, cliente_telefono, shopify_order_number, forma_pago, total")
    .eq("id", pedidoId)
    .maybeSingle();

  if (error || !pedido || !pedido.cliente_email) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const metodoPago = METODO_PAGO_LABEL[pedido.forma_pago ?? ""] ?? "transferencia";
  const numeroPedido = pedido.shopify_order_number ?? "";

  const { error: sendError } = await sendTransactionalEmail(pedido.cliente_email, {
    tipo: "pago_pendiente_verificacion",
    data: {
      nombre: pedido.cliente_nombre ?? "cliente",
      numeroPedido,
      metodoPago,
      whatsappUrl: whatsappLink(
        siteConfig.whatsappB2C,
        metodoPago === "contra entrega"
          ? `Hola, quiero coordinar la entrega de mi pedido ${numeroPedido} (pago contra entrega)`
          : `Hola, quiero enviar mi voucher de pago del pedido ${numeroPedido}`
      ),
    },
  });

  if (sendError) {
    console.error("No se pudo enviar el correo de pedido recibido:", sendError);
    return NextResponse.json({ ok: false, error: sendError }, { status: 502 });
  }

  // No bloquea la respuesta al cliente: si el aviso interno falla, el pedido
  // ya quedó registrado y el cliente ya recibió su correo — solo se pierde
  // la notificación a ventas@suplevet.pe, que queda logueada para revisar.
  const { error: notifyError } = await notificarEquipoVentas("nuevo_pedido", {
    pedidoId,
    numeroPedido,
    clienteNombre: pedido.cliente_nombre ?? "Cliente",
    clienteEmail: pedido.cliente_email,
    clienteTelefono: pedido.cliente_telefono,
    metodoPago,
    total: pedido.total ?? 0,
  });
  if (notifyError) {
    console.error("No se pudo notificar al equipo de ventas del pedido nuevo:", notifyError);
  }

  return NextResponse.json({ ok: true });
}
