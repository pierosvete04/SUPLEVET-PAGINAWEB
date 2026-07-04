"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Gift } from "lucide-react";
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
import { RegaloForm, type Regalo } from "@/components/admin/regalos/RegaloForm";

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Regalos</h2>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nuevo regalo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Regalo</TableHead>
                <TableHead>Condición</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
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
              {regalos.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-soft-gray">
                      {r.imagen ? (
                        <Image src={r.imagen} alt="" fill className="object-cover" sizes="40px" />
                      ) : (
                        <Gift className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <span className="font-medium">{r.nombre}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.condicion_tipo === "monto_minimo"
                      ? `Compra ≥ S/.${(r.condicion_monto_minimo ?? 0).toFixed(2)}`
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
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditando(r)}>
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
        <RegaloForm regalo={editando} onClose={cerrar} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
