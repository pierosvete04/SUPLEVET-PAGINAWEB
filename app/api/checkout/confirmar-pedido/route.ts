import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/emails/send";
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
    .select("cliente_email, cliente_nombre, shopify_order_number, forma_pago")
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
        `Hola, quiero enviar mi voucher de pago del pedido ${numeroPedido}`
      ),
    },
  });

  if (sendError) {
    console.error("No se pudo enviar el correo de pedido recibido:", sendError);
    return NextResponse.json({ ok: false, error: sendError }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
