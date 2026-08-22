export interface ItemPedido {
  nombre: string;
  precio: number;
  cantidad: number;
  /** Slug de productos_web — lo escribe el checkout de la web. */
  sku?: string;
  /** Categoría del producto (ver CategoriaProducto). Gobierna los regalos por
   * categoría: cada unidad de "combo" desbloquea una bandana. */
  categoria?: string;
  /** ID de producto de Shopify — solo en pedidos sincronizados desde Shopify,
   * que llegan con `sku` vacío. Sirve para resolver la imagen igual. */
  producto_id?: string;
}

/** Un pago registrado del pedido. El caso típico es el cliente que adelanta
 * el 50% al hacer el pedido y paga el resto cuando Dinsides se lo entrega. */
export interface ComprobantePago {
  url: string;
  monto: number;
  /** ISO. Cuándo se registró el pago, no cuándo se subió la imagen. */
  fecha: string;
  nota?: string | null;
}

export interface DireccionEnvioPedido {
  departamento?: string;
  provincia?: string;
  distrito?: string;
  direccion?: string;
}

export interface PedidoAdmin {
  id: string;
  numero_pedido: string | null;
  cliente_id: string | null;
  cliente_email: string;
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  estado: string;
  estado_pago: "pendiente_verificacion" | "parcial" | "pagado" | "rechazado" | "cancelado";
  estado_preparacion: "no_preparado" | "en_preparacion" | "preparado" | "entregado" | "devuelto" | "cancelado";
  forma_pago: "tarjeta" | "yape_plin" | "transferencia" | "contra_entrega" | "shopify" | null;
  /** Primer comprobante. Se conserva por los pedidos viejos (y porque lo leen
   * el portal del cliente y el aviso de Telegram); los pagos en partes viven
   * en `comprobantes`. */
  captura_pago_url: string | null;
  /** Hasta 3 comprobantes: el adelanto, el saldo y uno de margen para cuando
   * el cliente paga en tres veces o manda una captura corregida. */
  comprobantes: ComprobantePago[];
  /** Suma de los montos de `comprobantes`. Con estado_pago "pagado" siempre
   * iguala al total — lo fuerza el trigger sincronizar_monto_pagado. */
  monto_pagado: number;
  /** Columna calculada en Postgres: greatest(total - monto_pagado, 0). */
  saldo_pendiente: number;
  subtotal: number;
  total: number;
  descuento_monto: number;
  codigo_descuento: string | null;
  productos: ItemPedido[];
  zona_envio: string | null;
  direccion_envio: DireccionEnvioPedido | null;
  regalo_bandana: string | null;
  regalo_bandanas: { slug: string; talla: string | null }[] | null;
  /** Código del paquete que da el courier; lo escribe el equipo al despachar
   * y es lo único del rótulo que no sale del pedido. */
  codigo_rotulo: string | null;
  /** Empresa que hace la entrega (ver lib/couriers.ts). Se elige en el panel. */
  courier: string | null;
  /** Nombre libre cuando courier === "otro". */
  courier_otro: string | null;
  /** Soft-delete para pedidos de prueba — oculto del panel, pero se conserva
   * en Supabase (ver migración agregar_anulado_a_pedidos). */
  anulado: boolean;
  created_at: string;
}

/** Tope de comprobantes por pedido. También lo valida el CHECK
 * pedidos_comprobantes_check en Supabase. */
export const MAX_COMPROBANTES = 3;

export const BADGE_ESTADO_PAGO = {
  pendiente_verificacion: { color: "naranja" as const, label: "Pendiente de verificación" },
  parcial: { color: "ambar" as const, label: "Pago parcial" },
  pagado: { color: "verde" as const, label: "Pagado" },
  rechazado: { color: "rojo" as const, label: "Rechazado" },
  cancelado: { color: "gris" as const, label: "Cancelado" },
};

export const BADGE_ESTADO_PREPARACION = {
  no_preparado: { color: "gris" as const, label: "No preparado" },
  en_preparacion: { color: "azul" as const, label: "En preparación" },
  preparado: { color: "celeste" as const, label: "Preparado" },
  entregado: { color: "verde" as const, label: "Entregado" },
  devuelto: { color: "rojo" as const, label: "Devuelto" },
  cancelado: { color: "naranja" as const, label: "Cancelado" },
};

export function formatFechaPedido(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Badge del estado de pago tolerante a estados desconocidos.
 *
 * Existe por un incidente real (21-ago-2026): al aparecer en la base el estado
 * nuevo "parcial", el panel ya publicado —que todavía no lo conocía— hacía
 * `BADGE_ESTADO_PAGO[estado].color` sobre un `undefined` y la página entera
 * se caía con "Application error". Un estado que el front no conoce tiene que
 * degradar a una etiqueta gris, nunca tumbar la lista de pedidos: la base la
 * comparte el sistema interno de ventas y puede traer valores que este código
 * todavía no vio.
 */
export function badgeEstadoPago(estado: string | null | undefined): { color: BadgeColorPago; label: string } {
  return (
    BADGE_ESTADO_PAGO[estado as keyof typeof BADGE_ESTADO_PAGO] ?? {
      color: "gris" as const,
      label: estado ? capitalizarEstado(estado) : "Sin estado",
    }
  );
}

/** Misma tolerancia que badgeEstadoPago, para el estado de preparación. */
export function badgeEstadoPreparacion(
  estado: string | null | undefined
): { color: BadgeColorPreparacion; label: string } {
  return (
    BADGE_ESTADO_PREPARACION[estado as keyof typeof BADGE_ESTADO_PREPARACION] ?? {
      color: "gris" as const,
      label: estado ? capitalizarEstado(estado) : "Sin estado",
    }
  );
}

type BadgeColorPreparacion =
  | (typeof BADGE_ESTADO_PREPARACION)[keyof typeof BADGE_ESTADO_PREPARACION]["color"]
  | "gris";

type BadgeColorPago = (typeof BADGE_ESTADO_PAGO)[keyof typeof BADGE_ESTADO_PAGO]["color"] | "gris";

function capitalizarEstado(estado: string): string {
  const texto = estado.replace(/_/g, " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Saldo por cobrar. Preferir la columna calculada de Supabase cuando venga
 * en el select; el cálculo local es el respaldo para objetos armados a mano
 * (por ejemplo el pedido recién creado que todavía no se releyó). */
export function saldoPedido(pedido: {
  total: number;
  monto_pagado?: number | null;
  saldo_pendiente?: number | null;
}): number {
  if (pedido.saldo_pendiente != null) return Number(pedido.saldo_pendiente);
  return Math.max(Number(pedido.total) - Number(pedido.monto_pagado ?? 0), 0);
}

/** Cuánto entró realmente en caja por este pedido. Un pedido rechazado o
 * cancelado no cuenta ni siquiera el adelanto: si se devolvió la plata no fue
 * ingreso, y si no se devolvió es un caso que el equipo resuelve a mano. */
export function montoCobrado(pedido: { estado_pago: string; total: number; monto_pagado?: number | null }): number {
  if (pedido.estado_pago === "pagado") return Number(pedido.total);
  if (pedido.estado_pago === "parcial") return Number(pedido.monto_pagado ?? 0);
  return 0;
}

export function formatSoles(monto: number): string {
  return `S/ ${Number(monto).toFixed(2)}`;
}
