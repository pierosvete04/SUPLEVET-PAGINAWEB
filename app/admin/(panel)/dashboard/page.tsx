"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, PackageSearch } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { SectionCards } from "@/components/admin/SectionCards";
import { RevenueChart } from "@/components/admin/dashboard/RevenueChart";
import { EstadoBarChart } from "@/components/admin/dashboard/EstadoBarChart";
import { TableCard } from "@/components/admin/table/TableCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BrandedLoader } from "@/components/ui/branded-loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  calcularRango,
  getDashboardStats,
  PRESETS_PERIODO,
  type DashboardStats,
  type PresetPeriodo,
} from "@/lib/data/dashboard-admin";
import { BADGE_ESTADO_PAGO, formatFechaPedido } from "@/lib/data/pedidos-admin";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [preset, setPreset] = useState<PresetPeriodo>("este_mes");
  const [rangoPersonalizado, setRangoPersonalizado] = useState({ desde: "", hasta: "" });
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [cargando, setCargando] = useState(true);

  const rango = useMemo(() => calcularRango(preset, rangoPersonalizado), [preset, rangoPersonalizado]);
  const rangoIncompleto = preset === "personalizado" && (!rangoPersonalizado.desde || !rangoPersonalizado.hasta);

  useEffect(() => {
    if (rangoIncompleto) return;
    setCargando(true);
    getDashboardStats(createClient(), rango).then((data) => {
      setStats(data);
      setCargando(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rango, rangoIncompleto]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={preset} onValueChange={(v) => setPreset(v as PresetPeriodo)}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESETS_PERIODO.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {preset === "personalizado" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={rangoPersonalizado.desde}
                onChange={(e) => setRangoPersonalizado((r) => ({ ...r, desde: e.target.value }))}
              />
              <span className="text-sm text-muted-foreground">a</span>
              <input
                type="date"
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={rangoPersonalizado.hasta}
                onChange={(e) => setRangoPersonalizado((r) => ({ ...r, hasta: e.target.value }))}
              />
            </div>
          )}
        </div>
      </div>

      {!stats || cargando ? (
        <BrandedLoader />
      ) : (
        <>
          <SectionCards stats={stats} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/admin/pedidos?estado_pago=pendiente_verificacion"
              className="flex items-center gap-3 rounded-md border border-orange-200 bg-orange-50 p-4 transition-colors hover:bg-orange-100"
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-orange-600" />
              <p className="text-sm">
                <span className="font-semibold">{stats.alertaPendientesVerificacion}</span> pedidos pendientes de
                verificación
              </p>
            </Link>
            <Link
              href="/admin/pedidos?estado_preparacion=por_preparar"
              className="flex items-center gap-3 rounded-md border border-sky-200 bg-sky-50 p-4 transition-colors hover:bg-sky-100"
            >
              <PackageSearch className="h-5 w-5 shrink-0 text-sky-600" />
              <p className="text-sm">
                <span className="font-semibold">{stats.alertaPorPreparar}</span> pedidos por preparar
              </p>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Ingresos y pedidos en el tiempo</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart datos={stats.serieTiempo} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Pedidos por estado de pago</CardTitle>
              </CardHeader>
              <CardContent>
                <EstadoBarChart datos={stats.pedidosPorEstadoPago} titulo="Pedidos" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Pedidos por estado de preparación</CardTitle>
              </CardHeader>
              <CardContent>
                <EstadoBarChart datos={stats.pedidosPorEstadoPreparacion} titulo="Pedidos" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TableCard title="Top productos">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Unidades</TableHead>
                    <TableHead>Ingresos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topProductos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Sin ventas en este periodo.
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats.topProductos.map((p) => (
                      <TableRow key={p.nombre}>
                        <TableCell className="font-medium">{p.nombre}</TableCell>
                        <TableCell>{p.unidades}</TableCell>
                        <TableCell>S/.{p.ingresos.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableCard>

            <TableCard title="Top clientes">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Pedidos</TableHead>
                    <TableHead>Total comprado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topClientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Sin compras en este periodo.
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats.topClientes.map((c) => (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/admin/clientes/${c.id}`)}
                      >
                        <TableCell className="font-medium text-secondary">{c.nombre}</TableCell>
                        <TableCell>{c.pedidos}</TableCell>
                        <TableCell>S/.{c.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableCard>
          </div>

          <TableCard title="Pedidos recientes">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° pedido</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado del pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.pedidosRecientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Sin pedidos todavía.
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.pedidosRecientes.map((p) => {
                    const pago = BADGE_ESTADO_PAGO[p.estado_pago];
                    return (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/admin/pedidos/${p.id}`)}
                      >
                        <TableCell className="font-medium">
                          <Link
                            href={`/admin/pedidos/${p.id}`}
                            className="text-secondary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {p.shopify_order_number ?? `W-${p.id.slice(0, 8)}`}
                          </Link>
                        </TableCell>
                        <TableCell>{formatFechaPedido(p.created_at)}</TableCell>
                        <TableCell>{p.cliente_nombre ?? p.cliente_email}</TableCell>
                        <TableCell>S/.{Number(p.total).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge color={pago.color}>{pago.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableCard>
        </>
      )}
    </div>
  );
}
