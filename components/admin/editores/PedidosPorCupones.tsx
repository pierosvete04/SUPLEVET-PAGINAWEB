"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { SortableTableHead } from "@/components/admin/table/SortableTableHead";
import { TableCard } from "@/components/admin/table/TableCard";
import { TablePagination } from "@/components/admin/table/TablePagination";
import { useTableRows } from "@/components/admin/table/useTableRows";
import { EditorStatCards } from "@/components/admin/editores/EditorStatCards";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BADGE_ESTADO_PAGO, formatFechaPedido, type PedidoAdmin } from "@/lib/data/pedidos-admin";
import { mesActual, opcionesMes, rangoMes } from "@/lib/admin/filtro-mes";

interface PedidosPorCuponesProps {
  /** Códigos de cupón a incluir. Vacío = todavía sin cupones asignados. */
  codigos: string[];
  /** /admin/pedidos/[numero] para el admin; el editor no tiene esa ruta. */
  linkDetalle?: (pedido: PedidoAdmin) => string;
}

function valorOrden(p: PedidoAdmin, columna: string) {
  switch (columna) {
    case "numero":
      return p.numero_pedido ?? p.id;
    case "fecha":
      return p.created_at ?? "";
    case "cliente":
      return p.cliente_nombre ?? p.cliente_email ?? "";
    case "total":
      return Number(p.total);
    case "pago":
      return p.estado_pago;
    default:
      return null;
  }
}

// Mismos filtros que /admin/pedidos (mes, rango de fechas, estado de pago),
// reutilizados acá para el historial de un editor — tanto desde el detalle
// que ve el admin como desde el panel propio del editor.
export function PedidosPorCupones({ codigos, linkDetalle }: PedidosPorCuponesProps) {
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroPago, setFiltroPago] = useState("todos");
  const [filtroMes, setFiltroMes] = useState(mesActual());
  const [fechaDesde, setFechaDesde] = useState(() => rangoMes(mesActual()).desde);
  const [fechaHasta, setFechaHasta] = useState(() => rangoMes(mesActual()).hasta);

  useEffect(() => {
    if (codigos.length === 0) {
      setPedidos([]);
      setCargando(false);
      return;
    }
    async function cargar() {
      setCargando(true);
      let query = createClient()
        .from("pedidos")
        .select("*")
        .eq("anulado", false)
        .in("codigo_descuento", codigos)
        .order("created_at", { ascending: false });
      if (filtroPago !== "todos") query = query.eq("estado_pago", filtroPago);
      if (fechaDesde) query = query.gte("created_at", `${fechaDesde}T00:00:00`);
      if (fechaHasta) query = query.lte("created_at", `${fechaHasta}T23:59:59.999`);
      const { data } = await query;
      setPedidos((data as PedidoAdmin[]) ?? []);
      setCargando(false);
    }
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigos.join(","), filtroPago, fechaDesde, fechaHasta]);

  const { pageRows, totalRows, page, totalPages, setPage, sortColumn, sortDirection, toggleSort } = useTableRows({
    rows: pedidos,
    getSortValue: valorOrden,
  });

  const ventasTotal = pedidos.reduce((acc, p) => acc + Number(p.total), 0);
  const unidadesTotal = pedidos.reduce(
    (acc, p) => acc + p.productos.reduce((a, item) => a + item.cantidad, 0),
    0
  );

  function cambiarMes(valor: string) {
    setFiltroMes(valor);
    if (valor === "todos") {
      setFechaDesde("");
      setFechaHasta("");
      return;
    }
    const { desde, hasta } = rangoMes(valor);
    setFechaDesde(desde);
    setFechaHasta(hasta);
  }

  return (
    <div className="flex flex-col gap-6">
      <EditorStatCards ventasTotal={ventasTotal} pedidosCount={pedidos.length} unidadesCount={unidadesTotal} />

      {codigos.length === 0 ? (
        <TableCard>
          <p className="py-10 text-center text-sm text-muted-foreground">
            Todavía no tiene cupones asignados — sin cupón no hay ventas que atribuirle.
          </p>
        </TableCard>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1.5">
              <Label>Mes</Label>
              <Select value={filtroMes} onValueChange={cambiarMes}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todo el historial</SelectItem>
                  {opcionesMes().map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Desde</Label>
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => {
                  setFiltroMes("personalizado");
                  setFechaDesde(e.target.value);
                }}
                className="w-40"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Hasta</Label>
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => {
                  setFiltroMes("personalizado");
                  setFechaHasta(e.target.value);
                }}
                className="w-40"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Estado de pago</Label>
              <Select value={filtroPago} onValueChange={setFiltroPago}>
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                  <SelectItem value="pendiente_verificacion">Pendiente de verificación</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
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
                  <TableHead>Cupón</TableHead>
                  <SortableTableHead columnId="total" label="Total" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                  <SortableTableHead columnId="pago" label="Pago" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!cargando && pedidos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Sin ventas en este periodo.
                    </TableCell>
                  </TableRow>
                )}
                {pageRows.map((p) => {
                  const badge = BADGE_ESTADO_PAGO[p.estado_pago];
                  const fila = (
                    <>
                      <TableCell className="font-medium">{p.numero_pedido ?? p.id.slice(0, 8)}</TableCell>
                      <TableCell>{formatFechaPedido(p.created_at)}</TableCell>
                      <TableCell>{p.cliente_nombre ?? p.cliente_email}</TableCell>
                      <TableCell className="font-mono text-xs">{p.codigo_descuento}</TableCell>
                      <TableCell>S/.{Number(p.total).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge color={badge.color}>{badge.label}</Badge>
                      </TableCell>
                    </>
                  );
                  return linkDetalle ? (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => (window.location.href = linkDetalle(p))}>
                      {fila}
                    </TableRow>
                  ) : (
                    <TableRow key={p.id}>{fila}</TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination page={page} totalPages={totalPages} totalRows={totalRows} onPageChange={setPage} />
          </TableCard>
        </>
      )}
    </div>
  );
}
