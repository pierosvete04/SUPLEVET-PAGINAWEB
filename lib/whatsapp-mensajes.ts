import { siteConfig, whatsappLink } from "./site-config";

// Mensajes prellenados de los enlaces wa.me de los correos transaccionales.
//
// Antes cada ruta de API escribía el suyo a mano, así que había mensajes
// genéricos ("Hola, tuve un problema con el pago de mi pedido W-1069") y un
// caso —pedido devuelto— que directamente no pasaba ninguno y caía al número
// de ejemplo del componente. Centralizarlos acá evita las dos cosas.
//
// Tres reglas para escribirlos:
//
// 1. Primera persona y con nombre: el mensaje lo envía el CLIENTE, no nosotros.
//    Que llegue firmado ahorra la primera pregunta de toda conversación.
// 2. Contexto completo: número de pedido y motivo. Quien atiende no debería
//    tener que pedir datos que ya teníamos al enviar el correo.
// 3. Termina en una intención explícita ("quiero coordinar un reenvío"), no en
//    un saludo abierto. Eso define de qué se trata el chat desde el primer
//    mensaje.
//
// Que el cliente escriba primero también es deliberado del lado del costo: en
// la API de WhatsApp Business una conversación iniciada por el usuario es más
// barata que una iniciada por el negocio.

interface ContextoPedido {
  nombre: string;
  numeroPedido: string;
  motivo?: string;
}

export const mensajesWhatsapp = {
  /** Pedido devuelto al almacén — el cliente quiere que salga de nuevo. */
  reenvio: ({ nombre, numeroPedido, motivo }: ContextoPedido) =>
    `Hola, soy ${nombre}. Mi pedido ${numeroPedido} figura como devuelto` +
    `${motivo ? ` porque ${motivo}` : ""}. Quiero coordinar un reenvío, ¿qué necesitan de mi parte?`,

  /** Pago rechazado o no validado — el cliente quiere destrabarlo. */
  problemaPago: ({ nombre, numeroPedido, motivo }: ContextoPedido) =>
    `Hola, soy ${nombre}. El pago de mi pedido ${numeroPedido} no se pudo confirmar` +
    `${motivo ? ` (${motivo})` : ""}. ¿Me ayudan a resolverlo?`,

  /** Transferencia/Yape pendiente de validación — el cliente manda el voucher. */
  enviarVoucher: ({ nombre, numeroPedido }: ContextoPedido) =>
    `Hola, soy ${nombre}. Les envío el voucher de mi pedido ${numeroPedido} para que validen el pago.`,

  /** Pago ya confirmado — el cliente quiere saber cuándo le llega. */
  coordinarEntrega: ({ nombre, numeroPedido }: ContextoPedido) =>
    `Hola, soy ${nombre}. Mi pedido ${numeroPedido} ya está confirmado y quiero coordinar la entrega.`,

  /** Pedido cancelado — el cliente pide explicación o quiere reactivarlo. */
  pedidoCancelado: ({ nombre, numeroPedido, motivo }: ContextoPedido) =>
    `Hola, soy ${nombre}. Mi pedido ${numeroPedido} figura como cancelado` +
    `${motivo ? ` (${motivo})` : ""}. Quiero saber qué pasó y si puedo retomarlo.`,
} as const;

export type MensajeWhatsapp = keyof typeof mensajesWhatsapp;

/**
 * Construye el enlace wa.me al número B2C con el mensaje ya prellenado.
 * Es el único punto desde el que los correos deberían armar links de WhatsApp:
 * así ninguno puede volver a quedarse sin `whatsappUrl` y caer a un número
 * inventado.
 */
export function whatsappPedido(tipo: MensajeWhatsapp, contexto: ContextoPedido): string {
  return whatsappLink(siteConfig.whatsappB2C, mensajesWhatsapp[tipo](contexto));
}
