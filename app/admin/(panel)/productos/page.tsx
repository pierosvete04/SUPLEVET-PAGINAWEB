"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
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
import { ProductoForm, type ProductoWeb } from "@/components/admin/productos/ProductoForm";

function valorOrden(p: ProductoWeb, columna: string) {
  switch (columna) {
    case "nombre":
      return p.nombre;
    case "estado":
      return p.activo ? 1 : 0;
    case "categoria":
      return p.categoria;
    case "precio":
      return p.precio;
    case "stock":
      return p.stock ?? -1;
    default:
      return null;
  }
}

export default function AdminProductosPage() {
  const [productos, setProductos] = useState<ProductoWeb[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<ProductoWeb | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("productos_web")
      .select("*")
      .order("orden", { ascending: true });
    setProductos((data as ProductoWeb[]) ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function cerrarFormulario() {
    setEditando(null);
    setCreando(false);
  }

  async function recargarYCerrar() {
    await cargar();
    cerrarFormulario();
  }

  const { pageRows, totalRows, page, totalPages, setPage, sortColumn, sortDirection, toggleSort } = useTableRows({
    rows: productos,
    getSortValue: valorOrden,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Productos</h2>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Agregar producto
        </Button>
      </div>

      <TableCard badge={<Badge color="gris">{totalRows}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnId="nombre" label="Producto" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} className="w-full max-w-1/4" />
              <SortableTableHead columnId="estado" label="Estado" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="categoria" label="Categoría" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="precio" label="Precio" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="stock" label="Stock" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead>Proveedor</TableHead>
              <TableHead className="px-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && productos.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Sin productos todavía.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 rounded-md">
                      <AvatarImage src={p.imagen ?? undefined} alt="" className="object-cover" />
                      <AvatarFallback className="rounded-md bg-soft-gray" />
                    </Avatar>
                    <span className="font-medium whitespace-nowrap">{p.nombre}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge color={p.activo ? "verde" : "gris"}>{p.activo ? "Activo" : "Inactivo"}</Badge>
                </TableCell>
                <TableCell className="capitalize">{p.categoria}</TableCell>
                <TableCell>S/.{p.precio.toFixed(2)}</TableCell>
                <TableCell>{p.stock ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">SUPLEVET</TableCell>
                <TableCell className="px-4">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditando(p)}>
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
        <ProductoForm producto={editando} onClose={cerrarFormulario} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
