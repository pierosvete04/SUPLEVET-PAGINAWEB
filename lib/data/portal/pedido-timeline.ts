// Construye el timeline de estados que ve el cliente en el detalle de un
// pedido (portal). Combina el estado actual del pedido con las filas de
// pedido_historial (alimentada por trigger en cada cambio de
// estado_preparacion/estado_pago — ver migración crear_pedido_historial).
// Pedidos anteriores a esa migración no tienen filas de historial: sus pasos
// completados no muestran fecha, solo el check.

export interface PedidoHistorialRow {
  estado: string;
  created_at: string;
}

export interface PasoTimeline {
  key: string;
  label: string;
  fecha: string | null;
  completado: boolean;
}

interface PedidoParaTimeline {
  created_at: string;
  estado_pago: string | null;
  estado_preparacion: string;
  fecha_pago: string | null;
  fecha_entrega: string | null;
}

const ORDEN_PREPARACION = ["no_preparado", "en_preparacion", "preparado", "entregado"] as const;

const LABEL_PASO: Record<string, string> = {
  creado: "Pedido creado",
  pago_confirmado: "Pago confirmado",
  en_preparacion: "Preparando tu pedido",
  preparado: "Pedido en camino",
  entregado: "Pedido entregado",
  devuelto: "Pedido devuelto",
};

export function construirTimeline(pedido: PedidoParaTimeline, historial: PedidoHistorialRow[]): PasoTimeline[] {
  const fechaPorEstado = new Map(historial.map((h) => [h.estado, h.created_at]));

  const pasoCreado: PasoTimeline = {
    key: "creado",
    label: LABEL_PASO.creado,
    fecha: pedido.created_at,
    completado: true,
  };

  if (pedido.estado_preparacion === "devuelto") {
    return [
      pasoCreado,
      { key: "devuelto", label: LABEL_PASO.devuelto, fecha: fechaPorEstado.get("devuelto") ?? null, completado: true },
    ];
  }

  if (pedido.estado_pago === "rechazado" || pedido.estado_pago === "cancelado") {
    return [
      pasoCreado,
      {
        key: pedido.estado_pago,
        label: pedido.estado_pago === "rechazado" ? "Pago rechazado" : "Pedido cancelado",
        fecha: null,
        completado: true,
      },
    ];
  }

  const indiceActual = ORDEN_PREPARACION.indexOf(
    pedido.estado_preparacion as (typeof ORDEN_PREPARACION)[number]
  );

  const pasoPago: PasoTimeline = {
    key: "pago_confirmado",
    label: LABEL_PASO.pago_confirmado,
    fecha: pedido.fecha_pago ?? fechaPorEstado.get("pago_confirmado") ?? null,
    completado: pedido.estado_pago === "pagado" || indiceActual > 0,
  };

  const pasosPreparacion: PasoTimeline[] = (["en_preparacion", "preparado", "entregado"] as const).map((estado) => ({
    key: estado,
    label: LABEL_PASO[estado],
    fecha:
      (estado === "entregado" ? pedido.fecha_entrega : null) ?? fechaPorEstado.get(estado) ?? null,
    completado: indiceActual >= ORDEN_PREPARACION.indexOf(estado),
  }));

  return [pasoCreado, pasoPago, ...pasosPreparacion];
}

export function estadoBadgePedido(p: {
  estado_pago: string | null;
  estado_preparacion: string;
}): { texto: string; bg: string; color: string } {
  if (p.estado_pago === "rechazado") return { texto: "Pago rechazado", bg: "#fee2e2", color: "#991b1b" };
  if (p.estado_pago === "cancelado") return { texto: "Cancelado", bg: "#fee2e2", color: "#991b1b" };
  if (p.estado_pago !== "pagado") return { texto: "Pendiente de verificación", bg: "#fef3c7", color: "#92400e" };

  switch (p.estado_preparacion) {
    case "entregado":
      return { texto: "Entregado", bg: "#dcfce7", color: "#166534" };
    case "preparado":
      return { texto: "En camino", bg: "#dbeafe", color: "#1e40af" };
    case "en_preparacion":
      return { texto: "Preparando", bg: "#fef3c7", color: "#92400e" };
    case "devuelto":
      return { texto: "Devuelto", bg: "#f3f4f6", color: "#374151" };
    default:
      return { texto: "Pagado", bg: "#fef3c7", color: "#92400e" };
  }
}
