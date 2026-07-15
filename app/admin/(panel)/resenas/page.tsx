"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X, Star } from "lucide-react";
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
import type { Resena } from "@/lib/resenas";

const BADGE_ESTADO: Record<Resena["estado"], { color: "gris" | "verde" | "rojo"; texto: string }> = {
  pendiente: { color: "gris", texto: "Pendiente" },
  aprobada: { color: "verde", texto: "Aprobada" },
  rechazada: { color: "rojo", texto: "Rechazada" },
};

export default function AdminResenasPage() {
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("resenas")
      .select("*")
      .order("created_at", { ascending: false });
    setResenas((data as Resena[]) ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function moderar(id: string, estado: "aprobada" | "rechazada") {
    setProcesando(id);
    await createClient()
      .from("resenas")
      .update({ estado, revisado_at: new Date().toISOString() })
      .eq("id", id);
    await cargar();
    setProcesando(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reseñas</h2>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Comentario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!cargando && resenas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Sin reseñas todavía.
                  </TableCell>
                </TableRow>
              )}
              {resenas.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground">
                    {r.cliente_nombre || "Sin nombre"}
                    {r.cliente_ciudad && (
                      <span className="block text-xs text-muted-foreground/70">{r.cliente_ciudad}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.producto_nombre}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <Star
                          key={v}
                          className="h-3.5 w-3.5"
                          fill={v <= r.calificacion ? "#EA8C43" : "none"}
                          color={v <= r.calificacion ? "#EA8C43" : "#d1d5db"}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs text-muted-foreground">{r.texto}</TableCell>
                  <TableCell>
                    <Badge color={BADGE_ESTADO[r.estado].color}>{BADGE_ESTADO[r.estado].texto}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.estado === "pendiente" && (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={procesando === r.id}
                          onClick={() => moderar(r.id, "aprobada")}
                        >
                          <Check className="h-4 w-4 text-green-700" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={procesando === r.id}
                          onClick={() => moderar(r.id, "rechazada")}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
