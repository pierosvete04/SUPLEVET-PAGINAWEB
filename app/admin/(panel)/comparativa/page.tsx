"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { SortableTableHead } from "@/components/admin/table/SortableTableHead";
import { TableCard } from "@/components/admin/table/TableCard";
import { TablePagination } from "@/components/admin/table/TablePagination";
import { useTableRows } from "@/components/admin/table/useTableRows";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ComparativaFilaForm } from "@/components/admin/comparativa/ComparativaFilaForm";
import type { ComparativaFila } from "@/lib/comparativa";

function valorOrden(f: ComparativaFila, columna: string) {
  switch (columna) {
    case "beneficio":
      return f.beneficio;
    case "orden":
      return f.orden;
    case "estado":
      return f.activo ? 1 : 0;
    default:
      return null;
  }
}

export default function AdminComparativaPage() {
  const [filas, setFilas] = useState<ComparativaFila[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<ComparativaFila | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("comparativa_filas")
      .select("*")
      .order("orden", { ascending: true });
    setFilas((data as ComparativaFila[]) ?? []);
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
    rows: filas,
    getSortValue: valorOrden,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Comparativa</h2>
          <p className="text-sm text-muted-foreground">
            Sección &quot;Suplevet vs. otros suplementos&quot; de la página de producto.
          </p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nueva fila
        </Button>
      </div>

      <TableCard badge={<Badge color="gris">{totalRows}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnId="beneficio" label="Beneficio" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead>Suplevet</TableHead>
              <TableHead>Otros</TableHead>
              <SortableTableHead columnId="orden" label="Orden" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="estado" label="Estado" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead className="px-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && filas.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Sin filas configuradas.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((f) => (
              <TableRow key={f.id}>
                <TableCell>{f.beneficio}</TableCell>
                <TableCell className="text-muted-foreground">{f.suplevet_titulo}</TableCell>
                <TableCell className="text-muted-foreground">{f.otros_titulo}</TableCell>
                <TableCell className="text-muted-foreground">{f.orden}</TableCell>
                <TableCell>
                  <Badge color={f.activo ? "verde" : "gris"}>{f.activo ? "Activa" : "Inactiva"}</Badge>
                </TableCell>
                <TableCell className="px-4">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditando(f)}>
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
        <ComparativaFilaForm fila={editando} onClose={cerrar} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
