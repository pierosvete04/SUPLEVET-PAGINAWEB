"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { SortableTableHead } from "@/components/admin/table/SortableTableHead";
import { TableCard } from "@/components/admin/table/TableCard";
import { TablePagination } from "@/components/admin/table/TablePagination";
import { useTableRows } from "@/components/admin/table/useTableRows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { BADGE_NIVEL, formatFecha, nivelLabel, type ClienteResumen } from "@/lib/data/clientes-admin";
import { opcionesMes, rangoMes } from "@/lib/admin/filtro-mes";

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

export default function AdminClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<ClienteResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroMes, setFiltroMes] = useState("todos");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      let query = createClient().from("admin_clientes_resumen").select("*").order("created_at", { ascending: false });
      if (fechaDesde) query = query.gte("created_at", `${fechaDesde}T00:00:00`);
      if (fechaHasta) query = query.lte("created_at", `${fechaHasta}T23:59:59.999`);
      const { data } = await query;
      setClientes((data as ClienteResumen[]) ?? []);
      setCargando(false);
    }
    cargar();
  }, [fechaDesde, fechaHasta]);

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
      [c.nombre, c.apellido, c.email, c.telefono]
        .filter(Boolean)
        .some((campo) => campo!.toLowerCase().includes(termino))
    );
  }, [clientes, busqueda]);

  const { pageRows, totalRows, page, totalPages, setPage, sortColumn, sortDirection, toggleSort } = useTableRows({
    rows: clientesFiltrados,
    getSortValue: valorOrden,
  });

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Clientes</h2>
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

      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, email o teléfono…"
          className="bg-white pl-9"
          aria-label="Buscar clientes"
        />
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && clientesFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Sin clientes con este filtro.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((c) => (
              <TableRow
                key={c.id}
                className="cursor-pointer"
                onClick={() => router.push(`/admin/clientes/${c.id}`)}
              >
                <TableCell>
                  <Link
                    href={`/admin/clientes/${c.id}`}
                    className="font-medium text-secondary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {c.nombre || c.apellido ? `${c.nombre ?? ""} ${c.apellido ?? ""}`.trim() : "Sin nombre"}
                  </Link>
                </TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell className="text-muted-foreground">{c.telefono ?? "—"}</TableCell>
                <TableCell>
                  <Badge color={BADGE_NIVEL[c.nivel ?? "basico"] ?? "gris"}>{nivelLabel(c.nivel)}</Badge>
                </TableCell>
                <TableCell>{c.total_compras ?? 0}</TableCell>
                <TableCell className="text-muted-foreground">{formatFecha(c.ultima_compra_at)}</TableCell>
                <TableCell className="text-muted-foreground">{formatFecha(c.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination page={page} totalPages={totalPages} totalRows={totalRows} onPageChange={setPage} />
      </TableCard>
    </div>
  );
}
