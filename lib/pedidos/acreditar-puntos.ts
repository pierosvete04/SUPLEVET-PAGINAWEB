import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTransactionalEmail } from "@/lib/emails/send";

// Acreditación de SuplePoints extraída de /estado-preparacion, porque ahora
// hay dos momentos que la pueden disparar y ambos tienen que comportarse
// igual: marcar el pedido como entregado, y registrar el pago del saldo de un
// pedido entregado que quedó a medias. La RPC ya es idempotente
// (pedidos.puntos_acreditados > 0 corta), así que llamarla dos veces es seguro.

export interface ResultadoAcreditacion {
  ok: boolean;
  acreditados: boolean;
  /** Presente cuando la RPC rechazó por saldo: cuánto falta cobrar. */
  saldoPendiente?: number;
}

interface PedidoParaCorreo {
  cliente_email: string | null;
  cliente_nombre: string | null;
  numero_pedido: string | null;
}

export async function acreditarPuntosPedido(
  supabase: SupabaseClient,
  pedidoId: string,
  pedido: PedidoParaCorreo,
  notificar: boolean
): Promise<ResultadoAcreditacion> {
  // acreditar_puntos_pedido_web trae su propio candado is_admin() + el chequeo
  // de idempotencia — no se duplican acá.
  const { data: resultado, error: rpcError } = await supabase.rpc("acreditar_puntos_pedido_web", {
    p_pedido_id: pedidoId,
  });

  if (rpcError || !resultado?.ok) {
    // El saldo pendiente no es una falla: es el caso normal del pedido que se
    // entrega con el 50% por cobrar. Los puntos caen cuando se registre el
    // comprobante del saldo.
    if (resultado?.saldo_pendiente) {
      return { ok: true, acreditados: false, saldoPendiente: Number(resultado.saldo_pendiente) };
    }
    console.error("No se pudo acreditar SuplePoints del pedido:", rpcError ?? resultado?.error);
    return { ok: false, acreditados: false };
  }

  if (resultado.ya_procesado || !pedido.cliente_email || !notificar) {
    return { ok: true, acreditados: !!resultado.ya_procesado };
  }

  const { error: sendError } = await sendTransactionalEmail(pedido.cliente_email, {
    tipo: "puntos_acreditados",
    data: {
      nombre: pedido.cliente_nombre ?? "cliente",
      puntosGanados: resultado.puntos,
      saldoAnterior: resultado.saldo_anterior,
      saldoNuevo: resultado.saldo_nuevo,
      origen: `tu pedido ${pedido.numero_pedido ?? ""}`,
    },
  });

  if (sendError) {
    console.error("No se pudo enviar el correo de puntos acreditados:", sendError);
  }

  return { ok: true, acreditados: true };
}
