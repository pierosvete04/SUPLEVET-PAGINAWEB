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
import { ZonaForm } from "@/components/admin/envios/ZonaForm";
import type { EnvioZona } from "@/lib/shipping";

export default function AdminEnviosPage() {
  const [zonas, setZonas] = useState<EnvioZona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<EnvioZona | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("envio_zonas")
      .select("*")
      .order("orden", { ascending: true });
    setZonas((data as EnvioZona[]) ?? []);
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
        <h2 className="text-lg font-semibold">Zonas de envío</h2>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nueva zona
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zona</TableHead>
                <TableHead>Departamentos</TableHead>
                <TableHead>Tiempo</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Gratis desde</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!cargando && zonas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Sin zonas configuradas.
                  </TableCell>
                </TableRow>
              )}
              {zonas.map((z) => (
                <TableRow key={z.id} className="align-top">
                  <TableCell className="font-medium">{z.nombre}</TableCell>
                  <TableCell className="max-w-xs text-muted-foreground">
                    {z.departamentos.join(", ")}
                  </TableCell>
                  <TableCell>{z.tiempo_estimado}</TableCell>
                  <TableCell>S/.{z.costo_envio.toFixed(2)}</TableCell>
                  <TableCell>S/.{z.monto_minimo_gratis.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge color={z.activo ? "verde" : "gris"}>{z.activo ? "Activa" : "Inactiva"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditando(z)}>
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
        <ZonaForm zona={editando} onClose={cerrar} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
