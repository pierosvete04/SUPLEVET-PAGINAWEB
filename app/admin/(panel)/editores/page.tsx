"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { SortableTableHead } from "@/components/admin/table/SortableTableHead";
import { TableCard } from "@/components/admin/table/TableCard";
import { TablePagination } from "@/components/admin/table/TablePagination";
import { useTableRows } from "@/components/admin/table/useTableRows";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EditorForm } from "@/components/admin/editores/EditorForm";

interface EditorResumen {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
  created_at: string;
  cupones_count: number;
  pedidos_count: number;
  ventas_total: number;
}

function valorOrden(e: EditorResumen, columna: string) {
  switch (columna) {
    case "nombre":
      return e.nombre;
    case "cupones":
      return e.cupones_count;
    case "pedidos":
      return e.pedidos_count;
    case "ventas":
      return e.ventas_total;
    case "estado":
      return e.activo ? 1 : 0;
    default:
      return null;
  }
}

export default function AdminEditoresPage() {
  const [editores, setEditores] = useState<EditorResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("editores_resumen")
      .select("*")
      .order("created_at", { ascending: false });
    setEditores((data as EditorResumen[]) ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const { pageRows, totalRows, page, totalPages, setPage, sortColumn, sortDirection, toggleSort } = useTableRows({
    rows: editores,
    getSortValue: valorOrden,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Editores</h2>
          <p className="text-sm text-muted-foreground">
            Creadores de contenido con cupón propio — sus ventas se atribuyen automáticamente por código.
          </p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nuevo editor
        </Button>
      </div>

      <TableCard badge={<Badge color="gris">{totalRows}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnId="nombre" label="Nombre" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="cupones" label="Cupones" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="pedidos" label="Pedidos" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="ventas" label="Ventas" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="estado" label="Estado" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead className="px-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && editores.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Sin editores todavía.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((ed) => (
              <TableRow key={ed.id}>
                <TableCell>
                  <p className="font-medium">{ed.nombre}</p>
                  <p className="text-xs text-muted-foreground">{ed.email}</p>
                </TableCell>
                <TableCell>{ed.cupones_count}</TableCell>
                <TableCell>{ed.pedidos_count}</TableCell>
                <TableCell>S/.{ed.ventas_total.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge color={ed.activo ? "verde" : "gris"}>{ed.activo ? "Activo" : "Inactivo"}</Badge>
                </TableCell>
                <TableCell className="px-4">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/editores/${ed.id}`}>Ver detalle</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination page={page} totalPages={totalPages} totalRows={totalRows} onPageChange={setPage} />
      </TableCard>

      {creando && (
        <EditorForm
          onClose={() => setCreando(false)}
          onSaved={() => {
            setCreando(false);
            cargar();
          }}
        />
      )}
    </div>
  );
}
