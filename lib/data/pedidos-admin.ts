export interface ItemPedido {
  nombre: string;
  precio: number;
  cantidad: number;
  sku?: string;
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
  estado_pago: "pendiente_verificacion" | "pagado" | "rechazado";
  estado_preparacion: "no_preparado" | "en_preparacion" | "preparado" | "entregado";
  forma_pago: "tarjeta" | "yape_plin" | "transferencia" | "shopify" | null;
  captura_pago_url: string | null;
  subtotal: number;
  total: number;
  productos: ItemPedido[];
  zona_envio: string | null;
  direccion_envio: DireccionEnvioPedido | null;
  regalo_bandana: string | null;
  created_at: string;
}

export const BADGE_ESTADO_PAGO = {
  pendiente_verificacion: { color: "naranja" as const, label: "Pendiente de verificación" },
  pagado: { color: "verde" as const, label: "Pagado" },
  rechazado: { color: "rojo" as const, label: "Rechazado" },
};

export const BADGE_ESTADO_PREPARACION = {
  no_preparado: { color: "gris" as const, label: "No preparado" },
  en_preparacion: { color: "azul" as const, label: "En preparación" },
  preparado: { color: "celeste" as const, label: "Preparado" },
  entregado: { color: "verde" as const, label: "Entregado" },
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
