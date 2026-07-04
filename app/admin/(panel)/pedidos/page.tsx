"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BADGE_ESTADO_PAGO,
  BADGE_ESTADO_PREPARACION,
  formatFechaPedido,
  type PedidoAdmin,
} from "@/lib/data/pedidos-admin";

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroPago, setFiltroPago] = useState("todos");

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      let query = createClient().from("pedidos").select("*").order("created_at", { ascending: false });
      if (filtroPago !== "todos") query = query.eq("estado_pago", filtroPago);
      const { data } = await query;
      setPedidos((data as PedidoAdmin[]) ?? []);
      setCargando(false);
    }
    cargar();
  }, [filtroPago]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pedidos</h2>
        <Select value={filtroPago} onValueChange={setFiltroPago}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados de pago</SelectItem>
            <SelectItem value="pendiente_verificacion">Pendiente de verificación</SelectItem>
            <SelectItem value="pagado">Pagado</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° pedido</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado del pago</TableHead>
                <TableHead>Preparación</TableHead>
                <TableHead>Artículos</TableHead>
                <TableHead>Envío</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!cargando && pedidos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No hay pedidos con este filtro.
                  </TableCell>
                </TableRow>
              )}
              {pedidos.map((p) => {
                const pago = BADGE_ESTADO_PAGO[p.estado_pago];
                const prep = BADGE_ESTADO_PREPARACION[p.estado_preparacion];
                return (
                  <TableRow key={p.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link href={`/admin/pedidos/${p.id}`} className="text-primary hover:underline">
                        {p.shopify_order_number ?? `W-${p.id.slice(0, 8)}`}
                      </Link>
                    </TableCell>
                    <TableCell>{formatFechaPedido(p.created_at)}</TableCell>
                    <TableCell>{p.cliente_nombre ?? p.cliente_email}</TableCell>
                    <TableCell>S/.{Number(p.total).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge color={pago.color}>{pago.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge color={prep.color}>{prep.label}</Badge>
                    </TableCell>
                    <TableCell>{p.productos.reduce((acc, i) => acc + i.cantidad, 0)}</TableCell>
                    <TableCell className="text-muted-foreground">{p.zona_envio ?? "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
