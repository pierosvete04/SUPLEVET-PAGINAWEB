"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { SortableTableHead } from "@/components/admin/table/SortableTableHead";
import { TableCard } from "@/components/admin/table/TableCard";
import { TablePagination } from "@/components/admin/table/TablePagination";
import { useTableRows } from "@/components/admin/table/useTableRows";
import { useResponsivePageSize } from "@/components/admin/table/useResponsivePageSize";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  badgeEstadoPago,
  badgeEstadoPreparacion,
  BADGE_ESTADO_PAGO,
  BADGE_ESTADO_PREPARACION,
  formatFechaPedido,
  formatSoles,
  saldoPedido,
  type PedidoAdmin,
} from "@/lib/data/pedidos-admin";
import { mesActual, opcionesMes, rangoMes } from "@/lib/admin/filtro-mes";
import { capitalizar } from "@/lib/utils";

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
  const [filtroMes, setFiltroMes] = useState(() => searchParams.get("mes") ?? mesActual());
  const [fechaDesde, setFechaDesde] = useState(() => {
    const desdeUrl = searchParams.get("fecha_desde");
    if (desdeUrl) return desdeUrl;
    return filtroMes === "todos" ? "" : rangoMes(filtroMes).desde;
  });
  const [fechaHasta, setFechaHasta] = useState(() => {
    const hastaUrl = searchParams.get("fecha_hasta");
    if (hastaUrl) return hastaUrl;
    return filtroMes === "todos" ? "" : rangoMes(filtroMes).hasta;
  });
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [confirmarAnular, setConfirmarAnular] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      let query = createClient()
        .from("pedidos")
        .select("*")
        .eq("anulado", false)
        .order("created_at", { ascending: false });
      if (filtroPago !== "todos") query = query.eq("estado_pago", filtroPago);
      if (filtroPreparacion === "por_preparar") {
        query = query.in("estado_preparacion", ["no_preparado", "en_preparacion"]);
      } else if (filtroPreparacion !== "todos") {
        query = query.eq("estado_preparacion", filtroPreparacion);
      }
      if (fechaDesde) query = query.gte("created_at", `${fechaDesde}T00:00:00`);
      if (fechaHasta) query = query.lte("created_at", `${fechaHasta}T23:59:59.999`);
      const { data } = await query;
      setPedidos((data as PedidoAdmin[]) ?? []);
      setSeleccionados(new Set());
      setCargando(false);
    }
    cargar();
  }, [filtroPago, filtroPreparacion, fechaDesde, fechaHasta]);

  function alCambiarMes(valor: string) {
    setFiltroMes(valor);
    if (valor === "todos") {
      setFechaDesde("");
      setFechaHasta("");
    } else {
      const { desde, hasta } = rangoMes(valor);
      setFechaDesde(desde);
      setFechaHasta(hasta);
    }
  }

  function alternarSeleccion(id: string) {
    setSeleccionados((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  }

  async function anularSeleccionados() {
    const ids = Array.from(seleccionados);
    setAnulando(true);
    const { error } = await createClient()
      .from("pedidos")
      .update({ anulado: true, anulado_en: new Date().toISOString() })
      .in("id", ids);
    if (error) {
      toast.error("No se pudo anular los pedidos seleccionados.");
    } else {
      setPedidos((prev) => prev.filter((p) => !seleccionados.has(p.id)));
      setSeleccionados(new Set());
      toast.success(`${ids.length} pedido${ids.length === 1 ? "" : "s"} anulado${ids.length === 1 ? "" : "s"}. Se conservan en Supabase, solo se ocultan del panel.`);
    }
    setAnulando(false);
    setConfirmarAnular(false);
  }

  async function actualizarEstadoPago(id: string, estado: keyof typeof BADGE_ESTADO_PAGO) {
    setActualizandoId(id);
    const res = await fetch(`/api/admin/pedidos/${id}/estado-pago`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    if (res.ok) {
      setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, estado_pago: estado } : p)));
      toast.success("Estado del pago actualizado.");
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "No se pudo actualizar el estado del pago.");
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
      toast.success("Preparación actualizada.");
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "No se pudo actualizar la preparación.");
    }
    setActualizandoId(null);
  }

  const pedidosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return pedidos;
    return pedidos.filter((p) =>
      [p.numero_pedido, p.cliente_nombre, p.cliente_email, p.cliente_telefono]
        .filter(Boolean)
        .some((campo) => campo!.toLowerCase().includes(termino))
    );
  }, [pedidos, busqueda]);

  const pageSize = useResponsivePageSize();
  const { pageRows, totalRows, page, totalPages, setPage, sortColumn, sortDirection, toggleSort } = useTableRows({
    rows: pedidosFiltrados,
    getSortValue: valorOrden,
    pageSize,
  });

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

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
            <SelectTrigger className="w-64 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados de pago</SelectItem>
              <SelectItem value="pendiente_verificacion">Pendiente de verificación</SelectItem>
              <SelectItem value="parcial">Pago parcial (falta cobrar)</SelectItem>
              <SelectItem value="pagado">Pagado</SelectItem>
              <SelectItem value="rechazado">Rechazado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroPreparacion} onValueChange={setFiltroPreparacion}>
            <SelectTrigger className="w-64 bg-white">
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
          <Select value={filtroMes} onValueChange={alCambiarMes}>
            <SelectTrigger className="w-44 bg-white">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los meses</SelectItem>
              {opcionesMes().map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={fechaDesde}
              onChange={(e) => {
                setFechaDesde(e.target.value);
                setFiltroMes("");
              }}
              max={fechaHasta || undefined}
              className="w-40 bg-white"
              aria-label="Desde"
            />
            <span className="text-sm text-muted-foreground">a</span>
            <Input
              type="date"
              value={fechaHasta}
              onChange={(e) => {
                setFechaHasta(e.target.value);
                setFiltroMes("");
              }}
              min={fechaDesde || undefined}
              className="w-40 bg-white"
              aria-label="Hasta"
            />
            {(fechaDesde || fechaHasta) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFechaDesde("");
                  setFechaHasta("");
                  setFiltroMes("todos");
                }}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por N° de pedido, cliente, email o teléfono…"
          className="bg-white pl-9"
          aria-label="Buscar pedidos"
        />
      </div>

      {seleccionados.size > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-secondary/20 bg-secondary/5 px-4 py-2.5">
          <p className="text-sm font-medium">
            {seleccionados.size} pedido{seleccionados.size === 1 ? "" : "s"} seleccionado
            {seleccionados.size === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSeleccionados(new Set())}>
              Quitar selección
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setConfirmarAnular(true)}>
              Anular seleccionados
            </Button>
          </div>
        </div>
      )}

      <TableCard badge={<Badge color="gris">{totalRows}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Seleccionar todos los pedidos de esta página"
                  checked={pageRows.length > 0 && pageRows.every((p) => seleccionados.has(p.id))}
                  onCheckedChange={(marcado) => {
                    setSeleccionados((prev) => {
                      const siguiente = new Set(prev);
                      for (const p of pageRows) {
                        if (marcado) siguiente.add(p.id);
                        else siguiente.delete(p.id);
                      }
                      return siguiente;
                    });
                  }}
                />
              </TableHead>
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
            {!cargando && pedidosFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No hay pedidos con este filtro.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((p) => {
              const pago = badgeEstadoPago(p.estado_pago);
              const prep = badgeEstadoPreparacion(p.estado_preparacion);
              const actualizando = actualizandoId === p.id;
              return (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/admin/pedidos/${p.numero_pedido ?? p.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      aria-label={`Seleccionar pedido ${p.numero_pedido ?? p.id}`}
                      checked={seleccionados.has(p.id)}
                      onCheckedChange={() => alternarSeleccion(p.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/pedidos/${p.numero_pedido ?? p.id}`}
                      className="text-secondary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {p.numero_pedido ?? `W-${p.id.slice(0, 8)}`}
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
                          <Badge color={pago.color}>
                            {p.estado_pago === "parcial"
                              ? `Falta ${formatSoles(saldoPedido(p))}`
                              : pago.label}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(BADGE_ESTADO_PAGO)
                            // "Pago parcial" no se elige a mano: sale de sumar
                            // los comprobantes registrados en la ficha del
                            // pedido. Ofrecerlo acá dejaría pedidos marcados
                            // como parciales sin un solo sol registrado.
                            .filter(([valor]) => valor !== "parcial")
                            .map(([valor, { label }]) => (
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
                  <TableCell className="text-muted-foreground">
                    {p.zona_envio ? capitalizar(p.zona_envio) : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination page={page} totalPages={totalPages} totalRows={totalRows} onPageChange={setPage} />
      </TableCard>

      <AlertDialog open={confirmarAnular} onOpenChange={(open) => !open && setConfirmarAnular(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular {seleccionados.size} pedido{seleccionados.size === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Van a dejar de aparecer en este panel, pero se conservan en Supabase (no se borran de la base de
              datos). No se envía ningún correo al cliente. Esta acción no se puede deshacer desde aquí.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction disabled={anulando} onClick={anularSeleccionados}>
              {anulando ? "Anulando…" : "Anular"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
