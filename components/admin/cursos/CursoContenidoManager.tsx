"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, FileText, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getCursoDetalle, type CursoDetalle, type CursoLeccion, type CursoModulo, type CursoRecurso } from "@/lib/cursos";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ModuloForm } from "@/components/admin/cursos/ModuloForm";
import { LeccionForm } from "@/components/admin/cursos/LeccionForm";
import { RecursoForm } from "@/components/admin/cursos/RecursoForm";

interface CursoContenidoManagerProps {
  cursoId: string;
}

export function CursoContenidoManager({ cursoId }: CursoContenidoManagerProps) {
  const [curso, setCurso] = useState<CursoDetalle | null>(null);
  const [cargando, setCargando] = useState(true);

  const [moduloForm, setModuloForm] = useState<{ modulo: CursoModulo | null } | null>(null);
  const [leccionForm, setLeccionForm] = useState<{ moduloId: string; leccion: CursoLeccion | null } | null>(null);
  const [recursoForm, setRecursoForm] = useState<{ recurso: CursoRecurso | null } | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const detalle = await getCursoDetalle(createClient(), cursoId);
    setCurso(detalle);
    setCargando(false);
  }, [cursoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function borrarModulo(id: string) {
    if (!confirm("¿Eliminar este módulo y todas sus lecciones?")) return;
    await createClient().from("curso_modulos").delete().eq("id", id);
    cargar();
  }

  async function borrarLeccion(id: string) {
    if (!confirm("¿Eliminar esta lección?")) return;
    await createClient().from("curso_lecciones").delete().eq("id", id);
    cargar();
  }

  async function borrarRecurso(id: string) {
    if (!confirm("¿Eliminar este recurso?")) return;
    await createClient().from("curso_recursos").delete().eq("id", id);
    cargar();
  }

  if (cargando) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (!curso) return <p className="text-sm text-muted-foreground">Curso no encontrado.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/cursos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-lg font-semibold">{curso.titulo}</h2>
          <p className="text-sm text-muted-foreground">Módulos, lecciones y material de apoyo del curso.</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Módulos y lecciones</h3>
        <Button size="sm" onClick={() => setModuloForm({ modulo: null })}>
          <Plus className="h-4 w-4" /> Nuevo módulo
        </Button>
      </div>

      {curso.modulos.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Este curso todavía no tiene módulos. Crea el primero para empezar a agregar lecciones.
          </CardContent>
        </Card>
      )}

      {curso.modulos.map((modulo) => (
        <Card key={modulo.id}>
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <span className="text-xs text-muted-foreground">Orden {modulo.orden}</span>
                <p className="font-semibold">{modulo.titulo}</p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLeccionForm({ moduloId: modulo.id, leccion: null })}
                >
                  <Plus className="h-4 w-4" /> Lección
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setModuloForm({ modulo })}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => borrarModulo(modulo.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            {modulo.lecciones.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Sin lecciones en este módulo.</p>
            ) : (
              <div className="divide-y">
                {modulo.lecciones.map((leccion) => (
                  <div key={leccion.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium">{leccion.titulo}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {leccion.tipo} · {leccion.duracion_min ? `${leccion.duracion_min} min` : "sin duración"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLeccionForm({ moduloId: modulo.id, leccion })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => borrarLeccion(leccion.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <div className="mt-4 flex items-center justify-between">
        <h3 className="font-semibold">Material de apoyo</h3>
        <Button size="sm" onClick={() => setRecursoForm({ recurso: null })}>
          <Plus className="h-4 w-4" /> Nuevo recurso
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {curso.recursos.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Sin materiales de apoyo.</p>
          ) : (
            <div className="divide-y">
              {curso.recursos.map((recurso) => (
                <div key={recurso.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    {recurso.tipo === "descargable" ? (
                      <Download className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{recurso.titulo}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {recurso.tipo} {recurso.duracion_min ? `· ${recurso.duracion_min} min` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setRecursoForm({ recurso })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => borrarRecurso(recurso.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {moduloForm && (
        <ModuloForm
          cursoId={cursoId}
          modulo={moduloForm.modulo}
          siguienteOrden={curso.modulos.length}
          onClose={() => setModuloForm(null)}
          onSaved={() => {
            setModuloForm(null);
            cargar();
          }}
        />
      )}

      {leccionForm && (
        <LeccionForm
          moduloId={leccionForm.moduloId}
          leccion={leccionForm.leccion}
          siguienteOrden={curso.modulos.find((m) => m.id === leccionForm.moduloId)?.lecciones.length ?? 0}
          onClose={() => setLeccionForm(null)}
          onSaved={() => {
            setLeccionForm(null);
            cargar();
          }}
        />
      )}

      {recursoForm && (
        <RecursoForm
          cursoId={cursoId}
          recurso={recursoForm.recurso}
          siguienteOrden={curso.recursos.length}
          onClose={() => setRecursoForm(null)}
          onSaved={() => {
            setRecursoForm(null);
            cargar();
          }}
        />
      )}
    </div>
  );
}
