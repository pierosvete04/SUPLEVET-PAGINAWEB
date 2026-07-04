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
import { CuponForm, type Cupon } from "@/components/admin/cupones/CuponForm";

const LABEL_TIPO: Record<Cupon["tipo"], string> = {
  envio_gratis: "Envío gratis",
  pct_envio: "% envío",
  pct_producto: "% producto",
  monto_fijo_producto: "Monto fijo producto",
};

export default function AdminCuponesPage() {
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<Cupon | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("cupones")
      .select("*")
      .order("created_at", { ascending: false });
    setCupones((data as Cupon[]) ?? []);
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
        <h2 className="text-lg font-semibold">Cupones</h2>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nuevo cupón
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Condiciones</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!cargando && cupones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Sin cupones todavía.
                  </TableCell>
                </TableRow>
              )}
              {cupones.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.codigo}</TableCell>
                  <TableCell>{LABEL_TIPO[c.tipo]}</TableCell>
                  <TableCell>
                    {c.tipo === "envio_gratis"
                      ? "—"
                      : c.tipo.startsWith("pct")
                        ? `${c.valor}%`
                        : `S/.${c.valor.toFixed(2)}`}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.monto_minimo > 0 ? `Compra ≥ S/.${c.monto_minimo.toFixed(2)}` : "Sin mínimo"}
                  </TableCell>
                  <TableCell>
                    {c.usos_actuales} / {c.usos_maximos ?? "∞"}
                  </TableCell>
                  <TableCell>
                    <Badge color={c.activo ? "verde" : "gris"}>{c.activo ? "Activo" : "Inactivo"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditando(c)}>
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
        <CuponForm cupon={editando} onClose={cerrar} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
