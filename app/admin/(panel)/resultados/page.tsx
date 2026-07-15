"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Plus, ImageOff } from "lucide-react";
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
import { ResultadoRealForm } from "@/components/admin/resultados/ResultadoRealForm";
import type { ResultadoReal } from "@/lib/resultados-reales";

export default function AdminResultadosPage() {
  const [resultados, setResultados] = useState<ResultadoReal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<ResultadoReal | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("resultados_reales")
      .select("*")
      .order("orden", { ascending: true });
    setResultados((data as ResultadoReal[]) ?? []);
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
          <h2 className="text-lg font-semibold">Resultados reales</h2>
          <p className="text-sm text-muted-foreground">
            Sección &quot;Resultados reales, mascotas reales&quot; del Inicio.
          </p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nuevo resultado
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Antes</TableHead>
                <TableHead>Después</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Semanas</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!cargando && resultados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Sin resultados configurados.
                  </TableCell>
                </TableRow>
              )}
              {resultados.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-soft-gray">
                      {r.foto_antes_url ? (
                        <Image src={r.foto_antes_url} alt="" fill className="object-cover" sizes="40px" />
                      ) : (
                        <ImageOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-soft-gray">
                      {r.foto_despues_url ? (
                        <Image src={r.foto_despues_url} alt="" fill className="object-cover" sizes="40px" />
                      ) : (
                        <ImageOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{r.titulo}</TableCell>
                  <TableCell className="text-muted-foreground">{r.semanas}</TableCell>
                  <TableCell className="text-muted-foreground">{r.orden}</TableCell>
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
        <ResultadoRealForm resultado={editando} onClose={cerrar} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
