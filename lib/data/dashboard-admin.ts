import { createClient } from "@/lib/supabase/server";
import type { PedidoAdmin } from "@/lib/data/pedidos-admin";

export interface DashboardStats {
  totalPedidos: number;
  ingresosTotales: number;
  totalClientes: number;
  productosActivos: number;
  pedidosRecientes: PedidoAdmin[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [pedidosCount, pagados, clientesCount, productosCount, recientes] = await Promise.all([
    supabase.from("pedidos").select("id", { count: "exact", head: true }),
    supabase.from("pedidos").select("total").eq("estado_pago", "pagado"),
    supabase.from("admin_clientes_resumen").select("id", { count: "exact", head: true }),
    supabase.from("productos_web").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase.from("pedidos").select("*").order("created_at", { ascending: false }).limit(5),
  ]);

  const ingresosTotales = (pagados.data ?? []).reduce(
    (acc, p) => acc + Number((p as { total: number }).total),
    0
  );

  return {
    totalPedidos: pedidosCount.count ?? 0,
    ingresosTotales,
    totalClientes: clientesCount.count ?? 0,
    productosActivos: productosCount.count ?? 0,
    pedidosRecientes: (recientes.data as PedidoAdmin[]) ?? [],
  };
}
