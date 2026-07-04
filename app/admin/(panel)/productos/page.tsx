"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductoForm, type ProductoWeb } from "@/components/admin/productos/ProductoForm";

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Productos</h2>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Agregar producto
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead />
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
              {productos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-soft-gray">
                      {p.imagen && (
                        <Image src={p.imagen} alt="" fill className="object-cover" sizes="40px" />
                      )}
                    </div>
                    <span className="font-medium">{p.nombre}</span>
                  </TableCell>
                  <TableCell>
                    <Badge color={p.activo ? "verde" : "gris"}>{p.activo ? "Activo" : "Inactivo"}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">{p.categoria}</TableCell>
                  <TableCell>S/.{p.precio.toFixed(2)}</TableCell>
                  <TableCell>{p.stock ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">SUPLEVET</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditando(p)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {(creando || editando) && (
        <ProductoForm producto={editando} onClose={cerrarFormulario} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
