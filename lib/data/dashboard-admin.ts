import type { createClient } from "@/lib/supabase/client";
import type { BadgeColor } from "@/components/admin/Badge";
import {
  BADGE_ESTADO_PAGO,
  BADGE_ESTADO_PREPARACION,
  type ItemPedido,
  type PedidoAdmin,
} from "@/lib/data/pedidos-admin";

type SupabaseBrowserClient = ReturnType<typeof createClient>;

export interface RangoFecha {
  desde: string;
  hasta: string;
}

export type PresetPeriodo =
  | "este_mes"
  | "mes_anterior"
  | "ultimos_3_meses"
  | "ultimos_6_meses"
  | "este_anio"
  | "todo"
  | "personalizado";

export const PRESETS_PERIODO: { value: PresetPeriodo; label: string }[] = [
  { value: "este_mes", label: "Este mes" },
  { value: "mes_anterior", label: "Mes anterior" },
  { value: "ultimos_3_meses", label: "Últimos 3 meses" },
  { value: "ultimos_6_meses", label: "Últimos 6 meses" },
  { value: "este_anio", label: "Este año" },
  { value: "todo", label: "Todo" },
  { value: "personalizado", label: "Personalizado" },
];

function inicioDia(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function diaSiguiente(fecha: Date): Date {
  const f = inicioDia(fecha);
  f.setDate(f.getDate() + 1);
  return f;
}

export function calcularRango(preset: PresetPeriodo, personalizado?: { desde: string; hasta: string }): RangoFecha {
  const ahora = new Date();

  switch (preset) {
    case "este_mes":
      return {
        desde: new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString(),
        hasta: diaSiguiente(ahora).toISOString(),
      };
    case "mes_anterior":
      return {
        desde: new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1).toISOString(),
        hasta: new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString(),
      };
    case "ultimos_3_meses":
      return {
        desde: new Date(ahora.getFullYear(), ahora.getMonth() - 2, 1).toISOString(),
        hasta: diaSiguiente(ahora).toISOString(),
      };
    case "ultimos_6_meses":
      return {
        desde: new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1).toISOString(),
        hasta: diaSiguiente(ahora).toISOString(),
      };
    case "este_anio":
      return {
        desde: new Date(ahora.getFullYear(), 0, 1).toISOString(),
        hasta: diaSiguiente(ahora).toISOString(),
      };
    case "todo":
      return {
        desde: new Date(2020, 0, 1).toISOString(),
        hasta: diaSiguiente(ahora).toISOString(),
      };
    case "personalizado": {
      if (!personalizado?.desde || !personalizado?.hasta) return calcularRango("este_mes");
      return {
        desde: new Date(`${personalizado.desde}T00:00:00`).toISOString(),
        hasta: diaSiguiente(new Date(`${personalizado.hasta}T00:00:00`)).toISOString(),
      };
    }
  }
}

function rangoAnterior(rango: RangoFecha): RangoFecha {
  const desde = new Date(rango.desde);
  const hasta = new Date(rango.hasta);
  const duracion = hasta.getTime() - desde.getTime();
  return { desde: new Date(desde.getTime() - duracion).toISOString(), hasta: rango.desde };
}

function variacionPorcentual(actual: number, anterior: number): number | null {
  if (anterior === 0) return actual === 0 ? 0 : null;
  return ((actual - anterior) / anterior) * 100;
}

export interface PuntoSerieTiempo {
  fecha: string;
  ingresos: number;
  pedidos: number;
}

export interface ConteoEstado {
  estado: string;
  label: string;
  color: BadgeColor;
  cantidad: number;
}

export interface ProductoTop {
  nombre: string;
  unidades: number;
  ingresos: number;
}

export interface ClienteTop {
  id: string;
  nombre: string;
  total: number;
  pedidos: number;
}

export interface DashboardStats {
  totalPedidos: number;
  ingresosTotales: number;
  ticketPromedio: number;
  clientesNuevos: number;
  deltaPedidos: number | null;
  deltaIngresos: number | null;
  deltaTicket: number | null;
  deltaClientesNuevos: number | null;
  alertaPendientesVerificacion: number;
  alertaPorPreparar: number;
  serieTiempo: PuntoSerieTiempo[];
  pedidosPorEstadoPago: ConteoEstado[];
  pedidosPorEstadoPreparacion: ConteoEstado[];
  topProductos: ProductoTop[];
  topClientes: ClienteTop[];
  pedidosRecientes: PedidoAdmin[];
}

type PedidoResumenAgregado = Pick<
  PedidoAdmin,
  | "id"
  | "created_at"
  | "total"
  | "estado_pago"
  | "estado_preparacion"
  | "cliente_id"
  | "cliente_nombre"
  | "cliente_email"
  | "productos"
>;

function agregarIngresosPagados(pedidos: { total: number; estado_pago: string }[]): number {
  return pedidos.filter((p) => p.estado_pago === "pagado").reduce((acc, p) => acc + Number(p.total), 0);
}

export async function getDashboardStats(
  supabase: SupabaseBrowserClient,
  rango: RangoFecha
): Promise<DashboardStats> {
  const anterior = rangoAnterior(rango);
  const columnas =
    "id, created_at, total, estado_pago, estado_preparacion, cliente_id, cliente_nombre, cliente_email, productos";

  const [
    actualRes,
    anteriorRes,
    clientesActualRes,
    clientesAnteriorRes,
    pendientesRes,
    porPrepararRes,
    recientesRes,
  ] = await Promise.all([
    supabase.from("pedidos").select(columnas).gte("created_at", rango.desde).lt("created_at", rango.hasta),
    supabase
      .from("pedidos")
      .select("total, estado_pago")
      .gte("created_at", anterior.desde)
      .lt("created_at", anterior.hasta),
    supabase
      .from("admin_clientes_resumen")
      .select("id", { count: "exact", head: true })
      .gte("created_at", rango.desde)
      .lt("created_at", rango.hasta),
    supabase
      .from("admin_clientes_resumen")
      .select("id", { count: "exact", head: true })
      .gte("created_at", anterior.desde)
      .lt("created_at", anterior.hasta),
    supabase.from("pedidos").select("id", { count: "exact", head: true }).eq("estado_pago", "pendiente_verificacion"),
    supabase
      .from("pedidos")
      .select("id", { count: "exact", head: true })
      .in("estado_preparacion", ["no_preparado", "en_preparacion"]),
    supabase.from("pedidos").select("*").order("created_at", { ascending: false }).limit(5),
  ]);

  const pedidos = (actualRes.data as PedidoResumenAgregado[]) ?? [];
  const pedidosAnteriores = (anteriorRes.data as { total: number; estado_pago: string }[]) ?? [];

  const totalPedidos = pedidos.length;
  const ingresosTotales = agregarIngresosPagados(pedidos);
  const pedidosPagados = pedidos.filter((p) => p.estado_pago === "pagado");
  const ticketPromedio = pedidosPagados.length > 0 ? ingresosTotales / pedidosPagados.length : 0;
  const clientesNuevos = clientesActualRes.count ?? 0;

  const totalPedidosAnterior = pedidosAnteriores.length;
  const ingresosAnteriores = agregarIngresosPagados(pedidosAnteriores);
  const pedidosPagadosAnteriores = pedidosAnteriores.filter((p) => p.estado_pago === "pagado");
  const ticketPromedioAnterior =
    pedidosPagadosAnteriores.length > 0 ? ingresosAnteriores / pedidosPagadosAnteriores.length : 0;
  const clientesNuevosAnterior = clientesAnteriorRes.count ?? 0;

  const serieMap = new Map<string, { ingresos: number; pedidos: number }>();
  for (const p of pedidos) {
    const fecha = p.created_at.slice(0, 10);
    const punto = serieMap.get(fecha) ?? { ingresos: 0, pedidos: 0 };
    punto.pedidos += 1;
    if (p.estado_pago === "pagado") punto.ingresos += Number(p.total);
    serieMap.set(fecha, punto);
  }
  const serieTiempo: PuntoSerieTiempo[] = Array.from(serieMap.entries())
    .map(([fecha, valores]) => ({ fecha, ...valores }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const pedidosPorEstadoPago: ConteoEstado[] = Object.entries(BADGE_ESTADO_PAGO).map(([estado, { label, color }]) => ({
    estado,
    label,
    color,
    cantidad: pedidos.filter((p) => p.estado_pago === estado).length,
  }));

  const pedidosPorEstadoPreparacion: ConteoEstado[] = Object.entries(BADGE_ESTADO_PREPARACION).map(
    ([estado, { label, color }]) => ({
      estado,
      label,
      color,
      cantidad: pedidos.filter((p) => p.estado_preparacion === estado).length,
    })
  );

  const productosMap = new Map<string, { unidades: number; ingresos: number }>();
  for (const p of pedidos) {
    for (const item of (p.productos as ItemPedido[]) ?? []) {
      const acumulado = productosMap.get(item.nombre) ?? { unidades: 0, ingresos: 0 };
      acumulado.unidades += item.cantidad;
      acumulado.ingresos += item.precio * item.cantidad;
      productosMap.set(item.nombre, acumulado);
    }
  }
  const topProductos: ProductoTop[] = Array.from(productosMap.entries())
    .map(([nombre, valores]) => ({ nombre, ...valores }))
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 5);

  const clientesMap = new Map<string, { nombre: string; total: number; pedidos: number }>();
  for (const p of pedidos) {
    if (!p.cliente_id || p.estado_pago !== "pagado") continue;
    const acumulado = clientesMap.get(p.cliente_id) ?? {
      nombre: p.cliente_nombre ?? p.cliente_email,
      total: 0,
      pedidos: 0,
    };
    acumulado.total += Number(p.total);
    acumulado.pedidos += 1;
    clientesMap.set(p.cliente_id, acumulado);
  }
  const topClientes: ClienteTop[] = Array.from(clientesMap.entries())
    .map(([id, valores]) => ({ id, ...valores }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    totalPedidos,
    ingresosTotales,
    ticketPromedio,
    clientesNuevos,
    deltaPedidos: variacionPorcentual(totalPedidos, totalPedidosAnterior),
    deltaIngresos: variacionPorcentual(ingresosTotales, ingresosAnteriores),
    deltaTicket: variacionPorcentual(ticketPromedio, ticketPromedioAnterior),
    deltaClientesNuevos: variacionPorcentual(clientesNuevos, clientesNuevosAnterior),
    alertaPendientesVerificacion: pendientesRes.count ?? 0,
    alertaPorPreparar: porPrepararRes.count ?? 0,
    serieTiempo,
    pedidosPorEstadoPago,
    pedidosPorEstadoPreparacion,
    topProductos,
    topClientes,
    pedidosRecientes: (recientesRes.data as PedidoAdmin[]) ?? [],
  };
}
