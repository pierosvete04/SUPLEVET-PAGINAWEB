"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, ImageOff } from "lucide-react";
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
import { ResultadoRealForm } from "@/components/admin/resultados/ResultadoRealForm";
import type { ResultadoReal } from "@/lib/resultados-reales";

function valorOrden(r: ResultadoReal, columna: string) {
  switch (columna) {
    case "titulo":
      return r.titulo;
    case "semanas":
      return r.semanas;
    case "orden":
      return r.orden;
    case "estado":
      return r.activo ? 1 : 0;
    default:
      return null;
  }
}

export default function AdminResultadosPage() {
  const [resultados, setResultados] = useState<ResultadoReal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<ResultadoReal | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("resultados_reales")
      .select("*")
      .order("orden", { ascending: true });
    setResultados((data as ResultadoReal[]) ?? []);
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
    rows: resultados,
    getSortValue: valorOrden,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Resultados reales</h2>
          <p className="text-sm text-muted-foreground">
            Sección &quot;Resultados reales, mascotas reales&quot; del Inicio.
          </p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nuevo resultado
        </Button>
      </div>

      <TableCard badge={<Badge color="gris">{totalRows}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Antes</TableHead>
              <TableHead>Después</TableHead>
              <SortableTableHead columnId="titulo" label="Título" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="semanas" label="Semanas" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="orden" label="Orden" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="estado" label="Estado" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead className="px-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && resultados.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Sin resultados configurados.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Avatar className="h-10 w-10 rounded-md">
                    <AvatarImage src={r.foto_antes_url ?? undefined} alt="" className="object-cover" />
                    <AvatarFallback className="rounded-md bg-soft-gray">
                      <ImageOff className="h-4 w-4 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>
                  <Avatar className="h-10 w-10 rounded-md">
                    <AvatarImage src={r.foto_despues_url ?? undefined} alt="" className="object-cover" />
                    <AvatarFallback className="rounded-md bg-soft-gray">
                      <ImageOff className="h-4 w-4 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>{r.titulo}</TableCell>
                <TableCell className="text-muted-foreground">{r.semanas}</TableCell>
                <TableCell className="text-muted-foreground">{r.orden}</TableCell>
                <TableCell>
                  <Badge color={r.activo ? "verde" : "gris"}>{r.activo ? "Activo" : "Inactivo"}</Badge>
                </TableCell>
                <TableCell className="px-4">
                  <div className="flex justify-end">
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
        <ResultadoRealForm resultado={editando} onClose={cerrar} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
