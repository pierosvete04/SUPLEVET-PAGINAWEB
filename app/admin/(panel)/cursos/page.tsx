"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Play, FileText, Layers } from "lucide-react";
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
import { CursoForm } from "@/components/admin/cursos/CursoForm";
import type { Curso } from "@/lib/cursos";

export default function AdminCursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<Curso | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("cursos")
      .select("*")
      .order("orden", { ascending: true });
    setCursos((data as Curso[]) ?? []);
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
        <h2 className="text-lg font-semibold">Cursos</h2>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nuevo curso
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contenido</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!cargando && cursos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Sin cursos configurados.
                  </TableCell>
                </TableRow>
              )}
              {cursos.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="relative flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-soft-gray">
                      {c.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.thumbnail_url} alt="" className="h-full w-full object-cover" />
                      ) : c.tipo === "video" ? (
                        <Play className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.titulo}</TableCell>
                  <TableCell className="text-muted-foreground capitalize">{c.tipo}</TableCell>
                  <TableCell className="text-muted-foreground">{c.orden}</TableCell>
                  <TableCell>
                    <Badge color={c.activo ? "verde" : "gris"}>{c.activo ? "Activo" : "Inactivo"}</Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-1 text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/cursos/${c.id}`}>
                        <Layers className="h-4 w-4" /> Módulos
                      </Link>
                    </Button>
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
        <CursoForm curso={editando} onClose={cerrar} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
