import * as React from "react";
import CanjeConfirmado, { type CanjeConfirmadoProps } from "@/emails/canje-confirmado";
import CarritoAbandonado, { type CarritoAbandonadoProps } from "@/emails/carrito-abandonado";
import PagoConfirmado, { type PagoConfirmadoProps } from "@/emails/pago-confirmado";
import PagoEnVerificacion, { type PagoEnVerificacionProps } from "@/emails/pago-en-verificacion";
import PagoRechazado, { type PagoRechazadoProps } from "@/emails/pago-rechazado";
import PedidoCancelado, { type PedidoCanceladoProps } from "@/emails/pedido-cancelado";
import PedidoConfirmado, { type PedidoConfirmadoProps } from "@/emails/pedido-confirmado";
import PedidoDevuelto, { type PedidoDevueltoProps } from "@/emails/pedido-devuelto";
import PedidoEnCamino, { type PedidoEnCaminoProps } from "@/emails/pedido-en-camino";
import PedidoEnPreparacion, {
  type PedidoEnPreparacionProps,
} from "@/emails/pedido-en-preparacion";
import SuplepointsAcreditados, {
  type SuplepointsAcreditadosProps,
} from "@/emails/suplepoints-acreditados";
import { EMAIL_FROM, getResendClient } from "./resend";

// `tipo` coincide 1:1 con la columna `tipo` de la cola `emails_programados`
// descrita en PLAN.md §18, para que un futuro cron/Edge Function pueda leer
// una fila pendiente y llamar sendTransactionalEmail(cliente.email, { tipo: fila.tipo, data: fila.metadata }).
export type EmailPayload =
  | { tipo: "pedido_confirmado"; data: PedidoConfirmadoProps }
  | { tipo: "pago_confirmado"; data: PagoConfirmadoProps }
  | { tipo: "pago_pendiente_verificacion"; data: PagoEnVerificacionProps }
  | { tipo: "pago_error"; data: PagoRechazadoProps }
  | { tipo: "pago_cancelado"; data: PedidoCanceladoProps }
  | { tipo: "pedido_en_preparacion"; data: PedidoEnPreparacionProps }
  | { tipo: "pedido_en_camino"; data: PedidoEnCaminoProps }
  | { tipo: "pedido_devuelto"; data: PedidoDevueltoProps }
  | { tipo: "puntos_acreditados"; data: SuplepointsAcreditadosProps }
  | { tipo: "canje_confirmado"; data: CanjeConfirmadoProps }
  | { tipo: "carrito_abandonado"; data: CarritoAbandonadoProps };

interface RenderedEmail {
  subject: string;
  element: React.ReactElement;
}

function render(payload: EmailPayload): RenderedEmail {
  switch (payload.tipo) {
    case "pedido_confirmado":
      return {
        subject: `Recibimos tu pedido #${payload.data.numeroPedido} 🐾`,
        element: <PedidoConfirmado {...payload.data} />,
      };
    case "pago_confirmado":
      return {
        subject: `¡Tu pago fue confirmado! Pedido #${payload.data.numeroPedido} 🎉`,
        element: <PagoConfirmado {...payload.data} />,
      };
    case "pago_pendiente_verificacion":
      return {
        subject: `Estamos validando tu pago — pedido #${payload.data.numeroPedido}`,
        element: <PagoEnVerificacion {...payload.data} />,
      };
    case "pago_error":
      return {
        subject: `Hubo un problema con tu pago — pedido #${payload.data.numeroPedido}`,
        element: <PagoRechazado {...payload.data} />,
      };
    case "pago_cancelado":
      return {
        subject: `Tu pedido #${payload.data.numeroPedido} fue cancelado`,
        element: <PedidoCancelado {...payload.data} />,
      };
    case "pedido_en_preparacion":
      return {
        subject: `Estamos preparando tu pedido #${payload.data.numeroPedido}`,
        element: <PedidoEnPreparacion {...payload.data} />,
      };
    case "pedido_en_camino":
      return {
        subject: `¡Tu pedido #${payload.data.numeroPedido} está en camino! 🚚`,
        element: <PedidoEnCamino {...payload.data} />,
      };
    case "pedido_devuelto":
      return {
        subject: `Tu pedido #${payload.data.numeroPedido} fue devuelto`,
        element: <PedidoDevuelto {...payload.data} />,
      };
    case "puntos_acreditados":
      return {
        subject: `+${payload.data.puntosGanados} SuplePoints acreditados 🐾`,
        element: <SuplepointsAcreditados {...payload.data} />,
      };
    case "canje_confirmado":
      return {
        subject: `Tu canje fue exitoso — ${payload.data.nombreCanje} 🎁`,
        element: <CanjeConfirmado {...payload.data} />,
      };
    case "carrito_abandonado":
      return {
        subject: `${payload.data.nombre}, dejaste algo en tu carrito 🛒`,
        element: <CarritoAbandonado {...payload.data} />,
      };
  }
}

export interface SendEmailResult {
  id: string | null;
  error: string | null;
}

/**
 * Punto único de envío de correos transaccionales. Lo usan tanto endpoints
 * que envían al toque (ej. checkout tras confirmar el pago) como el futuro
 * cron/Edge Function que procese la cola `emails_programados` (PLAN.md §18).
 */
export async function sendTransactionalEmail(
  to: string,
  payload: EmailPayload
): Promise<SendEmailResult> {
  const { subject, element } = render(payload);
  const resend = getResendClient();

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    react: element,
  });

  if (error) {
    return { id: null, error: error.message };
  }

  return { id: data?.id ?? null, error: null };
}
