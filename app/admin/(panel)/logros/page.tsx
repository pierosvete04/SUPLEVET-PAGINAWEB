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
import type { LogroConfig } from "@/lib/data/portal/logros";
import { LogroConfigForm } from "@/components/admin/logros/LogroConfigForm";

export default function AdminLogrosPage() {
  const [logros, setLogros] = useState<LogroConfig[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<LogroConfig | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("logros_config")
      .select("*")
      .order("orden", { ascending: true });
    setLogros((data as LogroConfig[]) ?? []);
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
          <h2 className="text-lg font-semibold">Logros</h2>
          <p className="text-sm text-muted-foreground">
            Insignias que los clientes desbloquean en la sección &quot;Inicio&quot; del portal.
          </p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nuevo logro
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Logro</TableHead>
                <TableHead>Ícono</TableHead>
                <TableHead>Condición</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!cargando && logros.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Sin logros configurados.
                  </TableCell>
                </TableRow>
              )}
              {logros.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-muted-foreground">{l.orden}</TableCell>
                  <TableCell>
                    <span className="font-medium">{l.nombre}</span>
                    {l.descripcion && <p className="text-xs text-muted-foreground">{l.descripcion}</p>}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{l.icon}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {l.condicion_tipo ? `${l.condicion_tipo} ≥ ${l.condicion_valor}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge color={l.activo ? "verde" : "gris"}>{l.activo ? "Activo" : "Inactivo"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditando(l)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {(creando || editando) && <LogroConfigForm logro={editando} onClose={cerrar} onSaved={recargarYCerrar} />}
    </div>
  );
}
