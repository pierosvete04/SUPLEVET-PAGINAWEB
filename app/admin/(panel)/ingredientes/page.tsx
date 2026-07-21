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
import { IngredienteForm } from "@/components/admin/ingredientes/IngredienteForm";
import type { IngredienteProducto } from "@/lib/ingredientes";

function valorOrden(ing: IngredienteProducto, columna: string) {
  switch (columna) {
    case "nombre":
      return ing.nombre;
    case "beneficios":
      return ing.beneficios.length;
    case "orden":
      return ing.orden;
    case "estado":
      return ing.activo ? 1 : 0;
    default:
      return null;
  }
}

export default function AdminIngredientesPage() {
  const [ingredientes, setIngredientes] = useState<IngredienteProducto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<IngredienteProducto | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("ingredientes_producto")
      .select("*")
      .order("orden", { ascending: true });
    setIngredientes((data as IngredienteProducto[]) ?? []);
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
    rows: ingredientes,
    getSortValue: valorOrden,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ingredientes</h2>
          <p className="text-sm text-muted-foreground">
            Sección &quot;Ingredientes de alta calidad&quot; de la página de producto.
          </p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nuevo ingrediente
        </Button>
      </div>

      <TableCard badge={<Badge color="gris">{totalRows}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnId="nombre" label="Nombre" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="beneficios" label="Beneficios" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="orden" label="Orden" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="estado" label="Estado" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead className="px-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && ingredientes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Sin ingredientes configurados.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((ing) => (
              <TableRow key={ing.id} className="cursor-pointer" onClick={() => setEditando(ing)}>
                <TableCell>{ing.nombre}</TableCell>
                <TableCell className="text-muted-foreground">{ing.beneficios.length}</TableCell>
                <TableCell className="text-muted-foreground">{ing.orden}</TableCell>
                <TableCell>
                  <Badge color={ing.activo ? "verde" : "gris"}>
                    {ing.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="px-4">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditando(ing)}>
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
        <IngredienteForm ingrediente={editando} onClose={cerrar} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
