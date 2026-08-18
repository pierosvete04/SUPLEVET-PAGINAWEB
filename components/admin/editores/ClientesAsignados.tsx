"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import { Badge } from "@/components/admin/Badge";
import { SortableTableHead } from "@/components/admin/table/SortableTableHead";
import { TableCard } from "@/components/admin/table/TableCard";
import { TablePagination } from "@/components/admin/table/TablePagination";
import { useTableRows } from "@/components/admin/table/useTableRows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BADGE_NIVEL, formatFecha, nivelLabel, type ClienteResumen } from "@/lib/data/clientes-admin";
import { BADGE_ESTADO_PAGO } from "@/lib/data/pedidos-admin";
import { opcionesMes, rangoMes } from "@/lib/admin/filtro-mes";

interface ClientesAsignadosProps {
  editorId: string;
  /** Códigos de cupón del editor — para marcar con qué cupón (y en qué estado
   * de pago) convirtió cada cliente asignado. */
  codigosCupon: string[];
  /** false en el panel del propio editor: solo puede ver la lista, no tocarla. */
  puedeAsignar: boolean;
}

type EstadoPago = "pendiente_verificacion" | "pagado" | "rechazado" | "cancelado";

function valorOrden(c: ClienteResumen, columna: string) {
  switch (columna) {
    case "nombre":
      return c.nombre || c.apellido ? `${c.nombre ?? ""} ${c.apellido ?? ""}`.trim() : "Sin nombre";
    case "email":
      return c.email;
    case "nivel":
      return c.nivel ?? "basico";
    case "total_compras":
      return c.total_compras ?? 0;
    case "ultima_compra":
      return c.ultima_compra_at ?? "";
    case "registro":
      return c.created_at ?? "";
    default:
      return null;
  }
}

// Mismas columnas y filtros que /admin/clientes (mes de registro, rango de
// fechas, búsqueda) — acá filtrado a los clientes asignados a un editor, con
// una columna extra: si ya usó alguno de sus cupones y en qué estado de pago
// quedó ese pedido (no es una tabla nueva, es la misma con una columna más).
export function ClientesAsignados({ editorId, codigosCupon, puedeAsignar }: ClientesAsignadosProps) {
  const router = useRouter();
  const [clientes, setClientes] = useState<ClienteResumen[]>([]);
  const [estadoPorCliente, setEstadoPorCliente] = useState<Map<string, EstadoPago>>(new Map());
  const [cargando, setCargando] = useState(true);
  const [filtroMes, setFiltroMes] = useState("todos");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaAsignar, setBusquedaAsignar] = useState("");
  const [resultadosAsignar, setResultadosAsignar] = useState<ClienteResumen[]>([]);
  const [asignando, setAsignando] = useState<string | null>(null);
  const busquedaAsignarDebounced = useDebounce(busquedaAsignar, 300);

  async function cargar() {
    setCargando(true);
    const supabase = createClient();
    let query = supabase
      .from("admin_clientes_resumen")
      .select("*")
      .eq("editor_asignado_id", editorId)
      .order("created_at", { ascending: false });
    if (fechaDesde) query = query.gte("created_at", `${fechaDesde}T00:00:00`);
    if (fechaHasta) query = query.lte("created_at", `${fechaHasta}T23:59:59.999`);
    const [{ data: asignados }, { data: pedidosCupon }] = await Promise.all([
      query,
      codigosCupon.length > 0
        ? supabase
            .from("pedidos")
            .select("cliente_id, estado_pago, created_at")
            .in("codigo_descuento", codigosCupon)
            .eq("anulado", false)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as { cliente_id: string | null; estado_pago: EstadoPago }[] }),
    ]);
    setClientes((asignados as ClienteResumen[]) ?? []);
    // Ordenado desc: el primer pedido que aparece por cliente es el más
    // reciente — así el estado mostrado siempre es el último, no cualquiera.
    const estados = new Map<string, EstadoPago>();
    for (const p of pedidosCupon ?? []) {
      if (p.cliente_id && !estados.has(p.cliente_id)) estados.set(p.cliente_id, p.estado_pago);
    }
    setEstadoPorCliente(estados);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorId, codigosCupon.join(","), fechaDesde, fechaHasta]);

  useEffect(() => {
    if (!puedeAsignar) return;
    let cancelado = false;
    async function buscar() {
      const termino = busquedaAsignarDebounced.trim();
      if (!termino) {
        setResultadosAsignar([]);
        return;
      }
      const { data } = await createClient()
        .from("admin_clientes_resumen")
        .select("*")
        .or(`nombre.ilike.%${termino}%,apellido.ilike.%${termino}%,email.ilike.%${termino}%`)
        .limit(6);
      if (!cancelado) setResultadosAsignar((data as ClienteResumen[]) ?? []);
    }
    buscar();
    return () => {
      cancelado = true;
    };
  }, [busquedaAsignarDebounced, puedeAsignar]);

  async function asignar(clienteId: string) {
    setAsignando(clienteId);
    const { error } = await createClient()
      .from("clientes_perfil")
      .update({ editor_asignado_id: editorId })
      .eq("id", clienteId);
    if (!error) {
      setBusquedaAsignar("");
      setResultadosAsignar([]);
      await cargar();
    }
    setAsignando(null);
  }

  async function quitar(clienteId: string) {
    setAsignando(clienteId);
    const { error } = await createClient()
      .from("clientes_perfil")
      .update({ editor_asignado_id: null })
      .eq("id", clienteId);
    if (!error) await cargar();
    setAsignando(null);
  }

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

  const clientesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return clientes;
    return clientes.filter((c) =>
      [c.nombre, c.apellido, c.email, c.telefono].filter(Boolean).some((campo) => campo!.toLowerCase().includes(termino))
    );
  }, [clientes, busqueda]);

  const { pageRows, totalRows, page, totalPages, setPage, sortColumn, sortDirection, toggleSort } = useTableRows({
    rows: clientesFiltrados,
    getSortValue: valorOrden,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Clientes asignados</h3>
          <p className="text-xs text-muted-foreground">
            No cuenta como venta por sí solo — es para que {puedeAsignar ? "el editor" : "fidelices a este cliente y"}{" "}
            lo haga comprar con su código.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filtroMes} onValueChange={alCambiarMes}>
            <SelectTrigger className="w-44 bg-white">
              <SelectValue placeholder="Mes de registro" />
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
              aria-label="Registrado desde"
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
              aria-label="Registrado hasta"
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

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar entre sus clientes asignados…"
            className="bg-white pl-9"
            aria-label="Buscar clientes asignados"
          />
        </div>

        {puedeAsignar && (
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busquedaAsignar}
              onChange={(e) => setBusquedaAsignar(e.target.value)}
              placeholder="Asignar nuevo cliente por nombre o correo…"
              className="bg-white pl-9"
            />
            {resultadosAsignar.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-md">
                {resultadosAsignar.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={asignando === c.id}
                    onClick={() => asignar(c.id)}
                    className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-soft-gray disabled:opacity-50"
                  >
                    <span className="font-medium">
                      {c.nombre} {c.apellido}
                    </span>
                    <span className="text-xs text-muted-foreground">{c.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <TableCard badge={<Badge color="gris">{totalRows}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnId="nombre" label="Nombre" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="email" label="Email" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead>Teléfono</TableHead>
              <SortableTableHead columnId="nivel" label="Nivel" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="total_compras" label="Total compras" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="ultima_compra" label="Última compra" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="registro" label="Fecha de registro" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead>Cupón</TableHead>
              {puedeAsignar && <TableHead className="px-4" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && clientesFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={puedeAsignar ? 9 : 8} className="text-center text-muted-foreground">
                  Sin clientes asignados con este filtro.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((c) => {
              const estado = estadoPorCliente.get(c.id);
              const badge = estado ? BADGE_ESTADO_PAGO[estado] : null;
              const nombreCompleto = c.nombre || c.apellido ? `${c.nombre ?? ""} ${c.apellido ?? ""}`.trim() : "Sin nombre";
              // El editor no tiene acceso a /admin/clientes/[id] (middleware lo
              // rebota a su prefijo permitido) — el detalle con link solo tiene
              // sentido cuando esto lo ve un admin.
              return (
                <TableRow
                  key={c.id}
                  className={puedeAsignar ? "cursor-pointer" : undefined}
                  onClick={puedeAsignar ? () => router.push(`/admin/clientes/${c.id}`) : undefined}
                >
                  <TableCell>
                    {puedeAsignar ? (
                      <Link
                        href={`/admin/clientes/${c.id}`}
                        className="font-medium text-secondary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {nombreCompleto}
                      </Link>
                    ) : (
                      <span className="font-medium">{nombreCompleto}</span>
                    )}
                  </TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell className="text-muted-foreground">{c.telefono ?? "—"}</TableCell>
                  <TableCell>
                    <Badge color={BADGE_NIVEL[c.nivel ?? "basico"] ?? "gris"}>{nivelLabel(c.nivel)}</Badge>
                  </TableCell>
                  <TableCell>{c.total_compras ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">{formatFecha(c.ultima_compra_at)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatFecha(c.created_at)}</TableCell>
                  <TableCell>
                    {badge ? <Badge color={badge.color}>{badge.label}</Badge> : <Badge color="gris">Sin usar</Badge>}
                  </TableCell>
                  {puedeAsignar && (
                    <TableCell className="px-4">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Quitar asignación"
                          disabled={asignando === c.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            quitar(c.id);
                          }}
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
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
