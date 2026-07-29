"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { SortableTableHead } from "@/components/admin/table/SortableTableHead";
import { TableCard } from "@/components/admin/table/TableCard";
import { TablePagination } from "@/components/admin/table/TablePagination";
import { useTableRows } from "@/components/admin/table/useTableRows";
import { useResponsivePageSize } from "@/components/admin/table/useResponsivePageSize";
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
  BADGE_ESTADO_RECLAMO,
  LABEL_TIPO_SOLICITUD,
  diasHabilesTranscurridos,
  formatCorrelativoReclamo,
  reclamoVencido,
  PLAZO_DIAS_HABILES,
  type LibroReclamacion,
} from "@/lib/data/libro-reclamaciones-admin";

function valorOrden(r: LibroReclamacion, columna: string) {
  switch (columna) {
    case "correlativo":
      return r.correlativo;
    case "fecha":
      return r.created_at;
    case "tipo":
      return r.tipo_solicitud;
    case "consumidor":
      return r.consumidor_nombre;
    case "estado":
      return r.estado;
    default:
      return null;
  }
}

export default function AdminLibroReclamacionesPage() {
  const [reclamos, setReclamos] = useState<LibroReclamacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const cargar = useCallback(async () => {
    setCargando(true);
    let query = createClient()
      .from("libro_reclamaciones")
      .select("*")
      .order("created_at", { ascending: false });
    if (filtroEstado !== "todos") query = query.eq("estado", filtroEstado);
    const { data } = await query;
    setReclamos((data as LibroReclamacion[]) ?? []);
    setCargando(false);
  }, [filtroEstado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const pageSize = useResponsivePageSize();
  const { pageRows, totalRows, page, totalPages, setPage, sortColumn, sortDirection, toggleSort } = useTableRows({
    rows: reclamos,
    getSortValue: valorOrden,
    pageSize,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Libro de reclamaciones</h2>
          <p className="text-sm text-muted-foreground">
            Reclamos y quejas registrados por clientes. La Ley N.° 29571 exige responder en un
            plazo máximo de {PLAZO_DIAS_HABILES} días hábiles.
          </p>
        </div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-56 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_proceso">En proceso</SelectItem>
            <SelectItem value="resuelto">Resuelto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TableCard badge={<Badge color="gris">{totalRows}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnId="correlativo" label="N°" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="fecha" label="Fecha" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="tipo" label="Tipo" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="consumidor" label="Consumidor" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead>Bien</TableHead>
              <TableHead>Plazo</TableHead>
              <SortableTableHead columnId="estado" label="Estado" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && reclamos.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {filtroEstado === "todos" ? "Sin reclamos todavía." : "No hay reclamos con este filtro."}
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((r) => {
              const badge = BADGE_ESTADO_RECLAMO[r.estado];
              const vencido = reclamoVencido(r);
              const dias = diasHabilesTranscurridos(r.created_at);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/libro-reclamaciones/${r.id}`} className="text-secondary hover:underline">
                      {formatCorrelativoReclamo(r.correlativo, r.created_at)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("es-PE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>{LABEL_TIPO_SOLICITUD[r.tipo_solicitud]}</TableCell>
                  <TableCell>
                    {r.consumidor_nombre}
                    <span className="block text-xs text-muted-foreground/70">{r.consumidor_email}</span>
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">{r.tipo_bien}</TableCell>
                  <TableCell className={vencido ? "font-medium text-destructive" : "text-muted-foreground"}>
                    {r.estado === "resuelto"
                      ? "—"
                      : vencido
                        ? `Vencido (${dias} días hábiles)`
                        : `${dias} / ${PLAZO_DIAS_HABILES} días hábiles`}
                  </TableCell>
                  <TableCell>
                    <Badge color={badge.color}>{badge.label}</Badge>
                  </TableCell>
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
