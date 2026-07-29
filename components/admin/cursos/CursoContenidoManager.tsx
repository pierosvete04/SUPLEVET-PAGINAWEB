"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { traducirErrorSupabase } from "@/lib/errores-supabase";
import { getCursoDetalle, type CursoDetalle, type CursoLeccion, type CursoModulo, type CursoRecurso } from "@/lib/cursos";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ModuloForm } from "@/components/admin/cursos/ModuloForm";
import { LeccionForm } from "@/components/admin/cursos/LeccionForm";
import { RecursoForm } from "@/components/admin/cursos/RecursoForm";
import { BrandedLoader } from "@/components/ui/branded-loader";

interface CursoContenidoManagerProps {
  cursoId: string;
}

type EliminarPendiente =
  | { tipo: "modulo"; id: string }
  | { tipo: "leccion"; id: string }
  | { tipo: "recurso"; id: string };

const CONFIRMACION_ELIMINAR: Record<EliminarPendiente["tipo"], { titulo: string; descripcion: string }> = {
  modulo: {
    titulo: "¿Eliminar este módulo?",
    descripcion: "También se eliminan todas sus lecciones. Esta acción no se puede deshacer.",
  },
  leccion: {
    titulo: "¿Eliminar esta lección?",
    descripcion: "Esta acción no se puede deshacer.",
  },
  recurso: {
    titulo: "¿Eliminar este recurso?",
    descripcion: "Esta acción no se puede deshacer.",
  },
};

export function CursoContenidoManager({ cursoId }: CursoContenidoManagerProps) {
  const [curso, setCurso] = useState<CursoDetalle | null>(null);
  const [cargando, setCargando] = useState(true);

  const [moduloForm, setModuloForm] = useState<{ modulo: CursoModulo | null } | null>(null);
  const [leccionForm, setLeccionForm] = useState<{ moduloId: string; leccion: CursoLeccion | null } | null>(null);
  const [recursoForm, setRecursoForm] = useState<{ recurso: CursoRecurso | null } | null>(null);
  const [eliminarPendiente, setEliminarPendiente] = useState<EliminarPendiente | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const detalle = await getCursoDetalle(createClient(), cursoId);
    setCurso(detalle);
    setCargando(false);
  }, [cursoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function confirmarEliminar() {
    if (!eliminarPendiente) return;
    const { tipo, id } = eliminarPendiente;
    const tabla = tipo === "modulo" ? "curso_modulos" : tipo === "leccion" ? "curso_lecciones" : "curso_recursos";
    const { error: deleteError } = await createClient().from(tabla).delete().eq("id", id);
    setEliminarPendiente(null);
    if (deleteError) {
      toast.error(traducirErrorSupabase(deleteError));
      return;
    }
    toast.success(
      tipo === "modulo" ? "Módulo eliminado." : tipo === "leccion" ? "Lección eliminada." : "Recurso eliminado."
    );
    cargar();
  }

  if (cargando) return <BrandedLoader />;
  if (!curso) return <p className="text-sm text-muted-foreground">Curso no encontrado.</p>;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/cursos" className="flex w-fit items-center gap-1 text-sm font-medium text-secondary">
        <ArrowLeft className="h-4 w-4" /> Volver a cursos
      </Link>
      <div className="flex items-center gap-3">
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
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Editar módulo"
                  onClick={() => setModuloForm({ modulo })}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Eliminar módulo"
                  onClick={() => setEliminarPendiente({ tipo: "modulo", id: modulo.id })}
                >
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
                        aria-label="Editar lección"
                        onClick={() => setLeccionForm({ moduloId: modulo.id, leccion })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar lección"
                        onClick={() => setEliminarPendiente({ tipo: "leccion", id: leccion.id })}
                      >
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
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Editar recurso"
                      onClick={() => setRecursoForm({ recurso })}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Eliminar recurso"
                      onClick={() => setEliminarPendiente({ tipo: "recurso", id: recurso.id })}
                    >
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

      <AlertDialog open={!!eliminarPendiente} onOpenChange={(open) => !open && setEliminarPendiente(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {eliminarPendiente && CONFIRMACION_ELIMINAR[eliminarPendiente.tipo].titulo}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {eliminarPendiente && CONFIRMACION_ELIMINAR[eliminarPendiente.tipo].descripcion}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarEliminar}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
