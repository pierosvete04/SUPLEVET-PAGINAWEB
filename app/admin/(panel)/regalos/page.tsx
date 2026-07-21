"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Gift } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { SortableTableHead } from "@/components/admin/table/SortableTableHead";
import { TableCard } from "@/components/admin/table/TableCard";
import { TablePagination } from "@/components/admin/table/TablePagination";
import { useTableRows } from "@/components/admin/table/useTableRows";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RegaloForm, type Regalo } from "@/components/admin/regalos/RegaloForm";

function valorOrden(r: Regalo, columna: string) {
  switch (columna) {
    case "nombre":
      return r.nombre;
    case "estado":
      return r.activo ? 1 : 0;
    default:
      return null;
  }
}

export default function AdminRegalosPage() {
  const [regalos, setRegalos] = useState<Regalo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<Regalo | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("regalos")
      .select("*")
      .order("created_at", { ascending: false });
    setRegalos((data as Regalo[]) ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function cerrar() {
    setEditando(null);
    setCreando(false);
  }

  async function recargarYCerrar() {
    await cargar();
    cerrar();
  }

  const { pageRows, totalRows, page, totalPages, setPage, sortColumn, sortDirection, toggleSort } = useTableRows({
    rows: regalos,
    getSortValue: valorOrden,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Regalos</h2>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nuevo regalo
        </Button>
      </div>

      <TableCard badge={<Badge color="gris">{totalRows}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnId="nombre" label="Regalo" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} className="w-full max-w-1/4" />
              <TableHead>Condición</TableHead>
              <TableHead>Vigencia</TableHead>
              <SortableTableHead columnId="estado" label="Estado" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead className="px-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && regalos.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Sin regalos configurados.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 rounded-md">
                      <AvatarImage src={r.imagen ?? undefined} alt="" className="object-cover" />
                      <AvatarFallback className="rounded-md bg-soft-gray">
                        <Gift className="h-5 w-5 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium whitespace-nowrap">{r.nombre}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.condicion_tipo === "monto_minimo"
                    ? `Compra ≥ S/.${(r.condicion_monto_minimo ?? 0).toFixed(2)}`
                    : r.condicion_tipo === "evento"
                      ? "Evento especial"
                      : `Producto: ${r.condicion_producto_slug ?? "—"}`}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.fecha_inicio || r.fecha_fin
                    ? `${r.fecha_inicio ?? "…"} → ${r.fecha_fin ?? "…"}`
                    : "Sin fecha límite"}
                </TableCell>
                <TableCell>
                  <Badge color={r.activo ? "verde" : "gris"}>{r.activo ? "Activo" : "Inactivo"}</Badge>
                </TableCell>
                <TableCell className="px-4">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/regalos/${r.id}`}>Variantes</Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditando(r)}>
                      Editar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination page={page} totalPages={totalPages} totalRows={totalRows} onPageChange={setPage} />
      </TableCard>

      {(creando || editando) && (
        <RegaloForm regalo={editando} onClose={cerrar} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
