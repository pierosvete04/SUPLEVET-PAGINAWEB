"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Play } from "lucide-react";
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
import { TestimonioForm } from "@/components/admin/testimonios/TestimonioForm";
import type { TestimonioVideo } from "@/lib/testimonios";

export default function AdminTestimoniosPage() {
  const [testimonios, setTestimonios] = useState<TestimonioVideo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<TestimonioVideo | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("testimonios_videos")
      .select("*")
      .order("orden", { ascending: true });
    setTestimonios((data as TestimonioVideo[]) ?? []);
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
        <h2 className="text-lg font-semibold">Testimonios</h2>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nuevo testimonio
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Video</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!cargando && testimonios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Sin testimonios configurados.
                  </TableCell>
                </TableRow>
              )}
              {testimonios.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="relative flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-soft-gray">
                      {t.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.thumbnail_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Play className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.titulo}</TableCell>
                  <TableCell className="text-muted-foreground">{t.orden}</TableCell>
                  <TableCell>
                    <Badge color={t.activo ? "verde" : "gris"}>{t.activo ? "Activo" : "Inactivo"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditando(t)}>
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
        <TestimonioForm testimonio={editando} onClose={cerrar} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
