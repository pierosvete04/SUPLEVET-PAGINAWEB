import type { PedidoAdmin } from "@/lib/data/pedidos-admin";
import { nombreCourier, COURIER_POR_DEFECTO } from "@/lib/couriers";
import { formatPrecio } from "@/lib/data/productos-shared";

// Arma el mensaje que se abre al tocar "Abrir conversación de WhatsApp" en el
// detalle del pedido. La idea es que quien atiende no tenga que redactar nada:
// el texto ya llega con el nombre del cliente, el número de pedido y lo que
// realmente está pasando con ese pedido ahora mismo.

/** Solo el primer nombre: "Hola María" suena a persona, "Hola María Elena Huamán Quispe" a sistema. */
function primerNombre(nombreCompleto: string | null): string {
  const primero = nombreCompleto?.trim().split(/\s+/)[0];
  return primero ? primero.charAt(0).toUpperCase() + primero.slice(1) : "";
}

function saludo(pedido: PedidoAdmin): string {
  const nombre = primerNombre(pedido.cliente_nombre);
  return nombre ? `Hola ${nombre}, somos de Suplevet.` : "Hola, somos de Suplevet.";
}

function numeroPedido(pedido: PedidoAdmin): string {
  return pedido.shopify_order_number ?? `W-${pedido.id.slice(0, 8)}`;
}

/**
 * Se devuelve la frase completa y no solo el nombre porque "sale con Entrega
 * propia" no se le dice a un cliente: cuando lo lleva el equipo, la forma
 * natural es "sale con nuestro propio equipo".
 */
function fraseCourier(pedido: PedidoAdmin): string {
  const id = pedido.courier ?? COURIER_POR_DEFECTO;
  if (id === "propia") return "con nuestro propio equipo";
  return `con ${nombreCourier(id, pedido.courier_otro)}`;
}

/**
 * El cuerpo del mensaje según el estado real del pedido.
 *
 * El estado de pago manda sobre el de preparación: si el pago fue rechazado o
 * el pedido cancelado, no tiene sentido hablar de la entrega. Recién cuando el
 * pago está resuelto (pagado, o contra entrega que se cobra al final) el
 * mensaje pasa a contar en qué va la preparación.
 */
function cuerpo(pedido: PedidoAdmin): string {
  const numero = numeroPedido(pedido);
  const courier = fraseCourier(pedido);
  const esContraEntrega = pedido.forma_pago === "contra_entrega";
  const total = formatPrecio(Number(pedido.total));

  if (pedido.estado_pago === "cancelado") {
    return `Te escribimos por tu pedido ${numero}: lo hemos cancelado. Si fue un error o quieres retomarlo, dinos por acá y lo vemos.`;
  }

  if (pedido.estado_pago === "rechazado") {
    return `Te escribimos por tu pedido ${numero}: no pudimos validar el pago. ¿Nos reenvías el comprobante por acá para revisarlo?`;
  }

  if (pedido.estado_pago === "pendiente_verificacion") {
    // Contra entrega no tiene pago que verificar por adelantado — el pedido ya
    // está confirmado y lo único pendiente es coordinar la entrega.
    return esContraEntrega
      ? `Te escribimos por tu pedido ${numero}, con pago contra entrega. Lo estamos coordinando para enviártelo ${courier}. Ten listos ${total} para pagarle al repartidor al recibirlo.`
      : `Te escribimos por tu pedido ${numero}: estamos validando tu pago. Apenas lo confirmemos te avisamos por acá.`;
  }

  // Desde acá el pago está OK: el mensaje lo define la preparación.
  switch (pedido.estado_preparacion) {
    case "no_preparado":
      return esContraEntrega
        ? `Te escribimos por tu pedido ${numero}: ya lo tenemos registrado y empezamos a alistarlo. Se te entregará ${courier}.`
        : `Te escribimos por tu pedido ${numero}: confirmamos tu pago y ya empezamos a alistarlo.`;

    case "en_preparacion":
      return `Te escribimos por tu pedido ${numero}: lo estamos preparando. Te avisamos apenas salga ${courier}.`;

    case "preparado":
      return esContraEntrega
        ? `Te escribimos por tu pedido ${numero}: ya está listo y sale ${courier}. Ten listos ${total} para pagarle al repartidor al recibirlo.`
        : `Te escribimos por tu pedido ${numero}: ya está listo y sale ${courier}. Te avisamos cuando esté en camino.`;

    case "entregado":
      return `Te escribimos por tu pedido ${numero}: nos figura como entregado. ¿Llegó todo bien? Cualquier cosa nos dices por acá.`;

    case "devuelto":
      return `Te escribimos por tu pedido ${numero}: nos figura como devuelto. Queremos entender qué pasó para ayudarte a resolverlo.`;
  }
}

export function mensajeWhatsappPedido(pedido: PedidoAdmin): string {
  return `${saludo(pedido)} ${cuerpo(pedido)}`;
}
