"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import {
  BADGE_ESTADO_PAGO,
  BADGE_ESTADO_PREPARACION,
  formatFechaPedido,
  type PedidoAdmin,
} from "@/lib/data/pedidos-admin";

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroPago, setFiltroPago] = useState("");

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      let query = createClient().from("pedidos").select("*").order("created_at", { ascending: false });
      if (filtroPago) query = query.eq("estado_pago", filtroPago);
      const { data } = await query;
      setPedidos((data as PedidoAdmin[]) ?? []);
      setCargando(false);
    }
    cargar();
  }, [filtroPago]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-body text-xl font-bold text-secondary">Pedidos</h1>
        <select
          value={filtroPago}
          onChange={(e) => setFiltroPago(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2 font-body text-sm text-secondary"
        >
          <option value="">Todos los estados de pago</option>
          <option value="pendiente_verificacion">Pendiente de verificación</option>
          <option value="pagado">Pagado</option>
          <option value="rechazado">Rechazado</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full font-body text-sm">
          <thead className="bg-soft-gray text-left text-xs font-bold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">N° pedido</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado del pago</th>
              <th className="px-4 py-3">Preparación</th>
              <th className="px-4 py-3">Artículos</th>
              <th className="px-4 py-3">Envío</th>
            </tr>
          </thead>
          <tbody>
            {!cargando && pedidos.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No hay pedidos con este filtro.
                </td>
              </tr>
            )}
            {pedidos.map((p) => {
              const pago = BADGE_ESTADO_PAGO[p.estado_pago];
              const prep = BADGE_ESTADO_PREPARACION[p.estado_preparacion];
              return (
                <tr
                  key={p.id}
                  onClick={() => (window.location.href = `/admin/pedidos/${p.id}`)}
                  className="cursor-pointer border-t border-border hover:bg-soft-gray"
                >
                  <td className="px-4 py-3 font-bold text-secondary">
                    <Link href={`/admin/pedidos/${p.id}`} onClick={(e) => e.stopPropagation()}>
                      {p.shopify_order_number ?? `W-${p.id.slice(0, 8)}`}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-secondary">{formatFechaPedido(p.created_at)}</td>
                  <td className="px-4 py-3 text-secondary">{p.cliente_nombre ?? p.cliente_email}</td>
                  <td className="px-4 py-3 text-secondary">S/.{Number(p.total).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Badge color={pago.color}>{pago.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={prep.color}>{prep.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-secondary">
                    {p.productos.reduce((acc, i) => acc + i.cantidad, 0)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.zona_envio ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
