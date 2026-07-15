"use client";

import { useCallback, useEffect, useState } from "react";
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
import { IngredienteForm } from "@/components/admin/ingredientes/IngredienteForm";
import type { IngredienteProducto } from "@/lib/ingredientes";

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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Beneficios</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
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
              {ingredientes.map((ing) => (
                <TableRow key={ing.id}>
                  <TableCell>{ing.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{ing.beneficios.length}</TableCell>
                  <TableCell className="text-muted-foreground">{ing.orden}</TableCell>
                  <TableCell>
                    <Badge color={ing.activo ? "verde" : "gris"}>
                      {ing.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditando(ing)}>
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
        <IngredienteForm ingrediente={editando} onClose={cerrar} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
