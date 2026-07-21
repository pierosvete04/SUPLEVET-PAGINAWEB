"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { SortableTableHead } from "@/components/admin/table/SortableTableHead";
import { TableCard } from "@/components/admin/table/TableCard";
import { TablePagination } from "@/components/admin/table/TablePagination";
import { useTableRows } from "@/components/admin/table/useTableRows";
import { Button } from "@/components/ui/button";
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

function valorOrden(p: PedidoAdmin, columna: string) {
  switch (columna) {
    case "numero":
      return p.shopify_order_number ?? p.id;
    case "fecha":
      return p.created_at ?? "";
    case "cliente":
      return p.cliente_nombre ?? p.cliente_email ?? "";
    case "total":
      return Number(p.total);
    case "pago":
      return p.estado_pago;
    case "preparacion":
      return p.estado_preparacion;
    default:
      return null;
  }
}

export default function AdminPedidosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroPago, setFiltroPago] = useState(() => searchParams.get("estado_pago") ?? "todos");
  const [filtroPreparacion, setFiltroPreparacion] = useState(
    () => searchParams.get("estado_preparacion") ?? "todos"
  );
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      let query = createClient().from("pedidos").select("*").order("created_at", { ascending: false });
      if (filtroPago !== "todos") query = query.eq("estado_pago", filtroPago);
      if (filtroPreparacion === "por_preparar") {
        query = query.in("estado_preparacion", ["no_preparado", "en_preparacion"]);
      } else if (filtroPreparacion !== "todos") {
        query = query.eq("estado_preparacion", filtroPreparacion);
      }
      const { data } = await query;
      setPedidos((data as PedidoAdmin[]) ?? []);
      setCargando(false);
    }
    cargar();
  }, [filtroPago, filtroPreparacion]);

  async function actualizarEstadoPago(id: string, estado: keyof typeof BADGE_ESTADO_PAGO) {
    setActualizandoId(id);
    const res = await fetch(`/api/admin/pedidos/${id}/estado-pago`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    if (res.ok) {
      setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, estado_pago: estado } : p)));
    }
    setActualizandoId(null);
  }

  async function actualizarEstadoPreparacion(id: string, estado: keyof typeof BADGE_ESTADO_PREPARACION) {
    setActualizandoId(id);
    const res = await fetch(`/api/admin/pedidos/${id}/estado-preparacion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    if (res.ok) {
      setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, estado_preparacion: estado } : p)));
    }
    setActualizandoId(null);
  }

  const { pageRows, totalRows, page, totalPages, setPage, sortColumn, sortDirection, toggleSort } = useTableRows({
    rows: pedidos,
    getSortValue: valorOrden,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Pedidos</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/pedidos/nuevo">
            <Button size="sm">
              <Plus className="h-4 w-4" /> Crear pedido
            </Button>
          </Link>
          <Select value={filtroPago} onValueChange={setFiltroPago}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados de pago</SelectItem>
              <SelectItem value="pendiente_verificacion">Pendiente de verificación</SelectItem>
              <SelectItem value="pagado">Pagado</SelectItem>
              <SelectItem value="rechazado">Rechazado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroPreparacion} onValueChange={setFiltroPreparacion}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados de preparación</SelectItem>
              <SelectItem value="por_preparar">Por preparar</SelectItem>
              <SelectItem value="no_preparado">No preparado</SelectItem>
              <SelectItem value="en_preparacion">En preparación</SelectItem>
              <SelectItem value="preparado">Preparado</SelectItem>
              <SelectItem value="entregado">Entregado</SelectItem>
              <SelectItem value="devuelto">Devuelto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <TableCard badge={<Badge color="gris">{totalRows}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnId="numero" label="N° pedido" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="fecha" label="Fecha" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="cliente" label="Cliente" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="total" label="Total" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="pago" label="Estado del pago" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="preparacion" label="Preparación" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
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
            {pageRows.map((p) => {
              const pago = BADGE_ESTADO_PAGO[p.estado_pago];
              const prep = BADGE_ESTADO_PREPARACION[p.estado_preparacion];
              const actualizando = actualizandoId === p.id;
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
                    <div onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={p.estado_pago}
                        disabled={actualizando}
                        onValueChange={(valor) =>
                          actualizarEstadoPago(p.id, valor as keyof typeof BADGE_ESTADO_PAGO)
                        }
                      >
                        <SelectTrigger className="h-auto w-fit gap-1.5 border-none bg-transparent p-0 shadow-none focus:ring-0 [&_svg]:opacity-50">
                          <Badge color={pago.color}>{pago.label}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(BADGE_ESTADO_PAGO).map(([valor, { label }]) => (
                            <SelectItem key={valor} value={valor}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={p.estado_preparacion}
                        disabled={actualizando}
                        onValueChange={(valor) =>
                          actualizarEstadoPreparacion(p.id, valor as keyof typeof BADGE_ESTADO_PREPARACION)
                        }
                      >
                        <SelectTrigger className="h-auto w-fit gap-1.5 border-none bg-transparent p-0 shadow-none focus:ring-0 [&_svg]:opacity-50">
                          <Badge color={prep.color}>{prep.label}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(BADGE_ESTADO_PREPARACION).map(([valor, { label }]) => (
                            <SelectItem key={valor} value={valor}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>{p.productos.reduce((acc, i) => acc + i.cantidad, 0)}</TableCell>
                  <TableCell className="text-muted-foreground">{p.zona_envio ?? "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination page={page} totalPages={totalPages} totalRows={totalRows} onPageChange={setPage} />
      </TableCard>
    </div>
  );
}
