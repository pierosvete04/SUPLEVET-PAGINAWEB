export interface ProductoPedido {
  nombre?: string;
  name?: string;
  cantidad?: number;
  precio?: number;
  producto_id?: string;
}

export interface Pedido {
  id: string;
  shopify_order_number: string | null;
  shopify_order_id: string | null;
  estado: string;
  estado_pago: string | null;
  total: number;
  productos: ProductoPedido[];
  puntos_acreditados: number | null;
  fecha_agotamiento_estimada: string | null;
  fecha_pago: string | null;
  created_at: string;
  canal: "tienda";
}

// El estado a mostrarle al cliente: si el pago todavía no se confirma
// (estado_pago != "pagado"), eso pesa más que el `estado` de fulfillment
// (que en la BD arranca en "pagado" por defecto pero no refleja la
// verificación real — ver migración fix_registrar_pedido_web_estado_check).
export function estadoParaMostrar(p: Pick<Pedido, "estado" | "estado_pago">): string {
  if (p.estado_pago && p.estado_pago !== "pagado") return p.estado_pago;
  return p.estado;
}

export interface PedidoVet {
  id: string;
  veterinaria_nombre: string;
  monto_total: number;
  puntos_acreditados: number | null;
  estado: string;
  created_at: string;
  canal: "veterinaria";
}

export const ESTADO_PEDIDO: Record<string, { bg: string; color: string; texto: string }> = {
  pendiente_verificacion: { bg: "#fef3c7", color: "#92400e", texto: "Pendiente de verificación" },
  rechazado: { bg: "#fee2e2", color: "#991b1b", texto: "Pago rechazado" },
  pagado: { bg: "#fef3c7", color: "#92400e", texto: "Pagado" },
  en_camino: { bg: "#dbeafe", color: "#1e40af", texto: "En camino" },
  entregado: { bg: "#dcfce7", color: "#166534", texto: "Entregado" },
  cancelado: { bg: "#fee2e2", color: "#991b1b", texto: "Cancelado" },
  devuelto: { bg: "#f3f4f6", color: "#374151", texto: "Devuelto" },
  confirmado: { bg: "#dcfce7", color: "#166534", texto: "Confirmado" },
};
