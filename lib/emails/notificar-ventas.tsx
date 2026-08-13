import * as React from "react";
import { brand } from "@/emails/components/brand";
import NotificacionVenta, {
  type EventoNotificacionVenta,
} from "@/emails/interno-notificacion-venta";
import { EMAIL_FROM, getResendClient } from "./resend";

const VENTAS_EMAIL = process.env.VENTAS_NOTIFICATION_EMAIL ?? "ventas@suplevet.pe";

const ASUNTO_POR_EVENTO: Record<EventoNotificacionVenta, string> = {
  nuevo_pedido: "🛒 Nuevo pedido",
  pago_confirmado: "✅ Pago confirmado",
  pago_rechazado: "❌ Pago rechazado",
  pago_cancelado: "⚠️ Pago cancelado",
};

export interface DatosNotificacionVenta {
  pedidoId: string;
  numeroPedido: string;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string | null;
  metodoPago: string;
  total: number;
}

/**
 * Aviso interno al equipo de ventas por cada evento accionable de un pedido
 * (pedido nuevo, pago confirmado/rechazado/cancelado). Independiente de
 * sendTransactionalEmail — misma cuenta de Resend, pero destinatario y
 * plantilla distintos, así que no comparte el switch de EmailPayload que está
 * atado a la cola `emails_programados` orientada al cliente.
 */
export async function notificarEquipoVentas(
  evento: EventoNotificacionVenta,
  datos: DatosNotificacionVenta
): Promise<{ error: string | null }> {
  const resend = getResendClient();
  const urlPedido = `${brand.siteUrl}/admin/pedidos/${datos.numeroPedido || datos.pedidoId}`;

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: VENTAS_EMAIL,
    subject: `${ASUNTO_POR_EVENTO[evento]} — pedido #${datos.numeroPedido}`,
    react: (
      <NotificacionVenta
        evento={evento}
        numeroPedido={datos.numeroPedido}
        clienteNombre={datos.clienteNombre}
        clienteEmail={datos.clienteEmail}
        clienteTelefono={datos.clienteTelefono}
        metodoPago={datos.metodoPago}
        total={datos.total}
        urlPedido={urlPedido}
      />
    ),
  });

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}
