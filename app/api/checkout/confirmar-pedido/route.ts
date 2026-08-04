import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/emails/send";
import { notificarEquipoVentas } from "@/lib/emails/notificar-ventas";
import { notificarPedidoTelegram } from "@/lib/notificaciones/pedido-telegram";
import type { ItemPedido, MetodoPagoPedido } from "@/emails/pedido-confirmado";
import { whatsappPedido } from "@/lib/whatsapp-mensajes";

// Llamado por app/checkout/page.tsx justo después de registrar_pedido_web().
// Server-only a propósito: RESEND_API_KEY nunca debe llegar al bundle del
// cliente, así que el correo se arma y se manda desde acá, no desde el
// navegador. El pedido se relee de la BD (no se confía en lo que mande el
// cliente) — la RLS "Cliente ve sus pedidos" ya garantiza que solo el dueño
// del pedido (o un admin) puede leerlo.
const METODO_PAGO_LABEL: Record<string, MetodoPagoPedido> = {
  yape_plin: "Yape",
  transferencia: "transferencia",
  tarjeta: "tarjeta",
  contra_entrega: "contra entrega",
};

// Forma de `pedidos.direccion_envio` (jsonb). No trae nombre ni teléfono: esos
// viven en las columnas cliente_nombre / cliente_telefono del propio pedido.
interface DireccionEnvio {
  direccion?: string;
  direccionSecundaria?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const pedidoId = body?.pedidoId;
  if (typeof pedidoId !== "string" || !pedidoId) {
    return NextResponse.json({ error: "pedidoId requerido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: pedido, error } = await supabase
    .from("pedidos")
    // En una sola cadena literal a propósito: si se parte en dos con `+`,
    // supabase-js pierde la inferencia de tipos de las columnas y todo el
    // objeto queda como `GenericStringError`.
    .select("cliente_email, cliente_nombre, cliente_telefono, shopify_order_number, forma_pago, productos, direccion_envio, subtotal, total, descuento_monto")
    .eq("id", pedidoId)
    .maybeSingle();

  if (error || !pedido || !pedido.cliente_email) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const metodoPago = METODO_PAGO_LABEL[pedido.forma_pago ?? ""] ?? "transferencia";
  const numeroPedido = pedido.shopify_order_number ?? "";
  const nombre = pedido.cliente_nombre ?? "cliente";

  const subtotal = Number(pedido.subtotal ?? 0);
  const total = Number(pedido.total ?? 0);
  const descuento = Number(pedido.descuento_monto ?? 0);
  // El envío no se guarda en su propia columna: se deriva del total. Hacerlo
  // así (en vez de sumarlo aparte) garantiza que las líneas del resumen
  // cuadren con el total que el cliente ve en el portal.
  const envio = Math.max(total - subtotal + descuento, 0);

  const direccion = (pedido.direccion_envio ?? {}) as DireccionEnvio;
  const items = ((pedido.productos ?? []) as ItemPedido[]).map((p) => ({
    nombre: p.nombre,
    cantidad: p.cantidad,
    precio: p.precio,
  }));

  const { error: sendError } = await sendTransactionalEmail(pedido.cliente_email, {
    tipo: "pedido_confirmado",
    data: {
      nombre,
      numeroPedido,
      items,
      subtotal,
      envio,
      descuento,
      total,
      metodoPago,
      direccion: {
        nombreCompleto: nombre,
        direccion: [direccion.direccion, direccion.direccionSecundaria]
          .filter((parte) => parte && parte.trim())
          .join(" — "),
        distrito: [direccion.distrito, direccion.provincia].filter(Boolean).join(", "),
        telefono: pedido.cliente_telefono ?? "",
      },
      // Contra entrega no tiene voucher que enviar: lo único pendiente es
      // acordar cuándo pasa el motorizado.
      whatsappUrl: whatsappPedido(
        metodoPago === "contra entrega" ? "coordinarEntrega" : "enviarVoucher",
        { nombre, numeroPedido }
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

  // Mismo criterio que el correo interno: best-effort, no bloquea al cliente.
  const { error: telegramError } = await notificarPedidoTelegram("nuevo_pedido", pedidoId);
  if (telegramError) {
    console.error("No se pudo enviar el aviso de Telegram del pedido nuevo:", telegramError);
  }

  return NextResponse.json({ ok: true });
}
