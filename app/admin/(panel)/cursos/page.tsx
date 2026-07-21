"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Play, FileText, Layers } from "lucide-react";
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
import { CursoForm } from "@/components/admin/cursos/CursoForm";
import type { Curso } from "@/lib/cursos";

function valorOrden(c: Curso, columna: string) {
  switch (columna) {
    case "titulo":
      return c.titulo;
    case "tipo":
      return c.tipo;
    case "orden":
      return c.orden;
    case "estado":
      return c.activo ? 1 : 0;
    default:
      return null;
  }
}

export default function AdminCursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<Curso | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("cursos")
      .select("*")
      .order("orden", { ascending: true });
    setCursos((data as Curso[]) ?? []);
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
    rows: cursos,
    getSortValue: valorOrden,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cursos</h2>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nuevo curso
        </Button>
      </div>

      <TableCard badge={<Badge color="gris">{totalRows}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contenido</TableHead>
              <SortableTableHead columnId="titulo" label="Título" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="tipo" label="Tipo" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="orden" label="Orden" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="estado" label="Estado" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead className="px-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && cursos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Sin cursos configurados.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="relative flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-soft-gray">
                    {c.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.thumbnail_url} alt="" className="h-full w-full object-cover" />
                    ) : c.tipo === "video" ? (
                      <Play className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{c.titulo}</TableCell>
                <TableCell className="text-muted-foreground capitalize">{c.tipo}</TableCell>
                <TableCell className="text-muted-foreground">{c.orden}</TableCell>
                <TableCell>
                  <Badge color={c.activo ? "verde" : "gris"}>{c.activo ? "Activo" : "Inactivo"}</Badge>
                </TableCell>
                <TableCell className="px-4">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/cursos/${c.id}`}>
                        <Layers className="h-4 w-4" /> Módulos
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditando(c)}>
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
        <CursoForm curso={editando} onClose={cerrar} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
