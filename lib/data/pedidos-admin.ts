export interface ItemPedido {
  nombre: string;
  precio: number;
  cantidad: number;
  /** Slug de productos_web — lo escribe el checkout de la web. */
  sku?: string;
  /** ID de producto de Shopify — solo en pedidos sincronizados desde Shopify,
   * que llegan con `sku` vacío. Sirve para resolver la imagen igual. */
  producto_id?: string;
}

export interface DireccionEnvioPedido {
  departamento?: string;
  provincia?: string;
  distrito?: string;
  direccion?: string;
}

export interface PedidoAdmin {
  id: string;
  shopify_order_number: string | null;
  cliente_id: string | null;
  cliente_email: string;
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  estado: string;
  estado_pago: "pendiente_verificacion" | "pagado" | "rechazado" | "cancelado";
  estado_preparacion: "no_preparado" | "en_preparacion" | "preparado" | "entregado" | "devuelto";
  forma_pago: "tarjeta" | "yape_plin" | "transferencia" | "contra_entrega" | "shopify" | null;
  captura_pago_url: string | null;
  subtotal: number;
  total: number;
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
  created_at: string;
}

export const BADGE_ESTADO_PAGO = {
  pendiente_verificacion: { color: "naranja" as const, label: "Pendiente de verificación" },
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
