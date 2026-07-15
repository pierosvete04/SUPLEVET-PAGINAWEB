"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Curso } from "@/lib/cursos";

interface CursosGridProps {
  cursos: Curso[];
}

const CATEGORIAS: Record<string, string> = {
  nutricion: "Nutrición",
  comportamiento: "Comportamiento",
  salud: "Salud",
};

interface ProgresoCurso {
  cursoId: string;
  completadas: number;
  total: number;
}

export function CursosGrid({ cursos }: CursosGridProps) {
  const [filtro, setFiltro] = useState<string>("todos");
  const [progresos, setProgresos] = useState<ProgresoCurso[]>([]);

  useEffect(() => {
    async function cargarProgreso() {
      if (cursos.length === 0) return;
      const supabase = createClient();
      const { data: modulos } = await supabase
        .from("curso_modulos")
        .select("id, curso_id, curso_lecciones(id)")
        .in(
          "curso_id",
          cursos.map((c) => c.id)
        );
      if (!modulos || modulos.length === 0) return;

      const leccionIdsPorCurso = new Map<string, string[]>();
      for (const m of modulos) {
        const ids = (m.curso_lecciones ?? []).map((l: { id: string }) => l.id);
        leccionIdsPorCurso.set(m.curso_id, [...(leccionIdsPorCurso.get(m.curso_id) ?? []), ...ids]);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const todasLasLecciones = [...leccionIdsPorCurso.values()].flat();
      const { data: completadas } = await supabase
        .from("cliente_leccion_progreso")
        .select("leccion_id")
        .eq("cliente_id", user.id)
        .in("leccion_id", todasLasLecciones);
      const completadasSet = new Set((completadas ?? []).map((c) => c.leccion_id));

      const lista: ProgresoCurso[] = [];
      for (const [cursoId, ids] of leccionIdsPorCurso) {
        const hechas = ids.filter((id) => completadasSet.has(id)).length;
        if (hechas > 0) lista.push({ cursoId, completadas: hechas, total: ids.length });
      }
      setProgresos(lista);
    }
    cargarProgreso();
  }, [cursos]);

  const cursoEnProgreso = progresos.find((p) => p.completadas < p.total);
  const cursoDestacadoEnProgreso = cursoEnProgreso ? cursos.find((c) => c.id === cursoEnProgreso.cursoId) : null;

  const categoriasDisponibles = useMemo(
    () => [...new Set(cursos.map((c) => c.categoria).filter(Boolean))] as string[],
    [cursos]
  );

  const cursosFiltrados = filtro === "todos" ? cursos : cursos.filter((c) => c.categoria === filtro);

  return (
    <div>
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-portal-navy p-8 text-white">
        <span className="material-symbols-rounded pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 text-[180px] text-white/5">
          school
        </span>
        <span className="mb-1 block text-xs font-bold uppercase tracking-[0.2em] text-portal-orange">
          Aprendizaje Continuo
        </span>
        <h1 className="font-display text-4xl font-semibold">Cursos para Pet Lovers</h1>
        <p className="mt-2 max-w-md text-sm text-white/70">
          Aprende sobre nutrición, salud y bienestar para tus mascotas con expertos veterinarios de confianza.
        </p>
      </div>

      {/* Filtros */}
      {categoriasDisponibles.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFiltro("todos")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                filtro === "todos" ? "bg-portal-navy text-white" : "bg-white text-portal-muted hover:bg-portal-surface-low"
              }`}
            >
              Todos
            </button>
            {categoriasDisponibles.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFiltro(cat)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  filtro === cat ? "bg-portal-navy text-white" : "bg-white text-portal-muted hover:bg-portal-surface-low"
                }`}
              >
                {CATEGORIAS[cat] ?? cat}
              </button>
            ))}
          </div>
          <span className="text-sm text-portal-muted">Mostrando {cursosFiltrados.length} cursos disponibles</span>
        </div>
      )}

      {cursos.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-portal-surface-variant bg-white py-16 text-center">
          <span className="material-symbols-rounded text-5xl text-portal-muted">school</span>
          <h3 className="mt-3 font-display text-xl font-semibold text-portal-navy">Aún no hay cursos disponibles</h3>
          <p className="mt-1 text-sm text-portal-muted">Muy pronto publicaremos contenido de la Academia Suplevet.</p>
        </div>
      ) : (
        <>
          {cursoDestacadoEnProgreso && cursoEnProgreso && (
            <div className="mb-8">
              <div className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-portal-navy">
                <span className="material-symbols-rounded text-portal-orange">bookmark</span> Cursos en Progreso
              </div>
              <Link
                href={`/mi-cuenta/cursos/${cursoDestacadoEnProgreso.id}`}
                className="flex flex-col gap-4 rounded-2xl border-t-4 border-t-portal-orange bg-white p-4 sm:flex-row"
              >
                <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-portal-surface-low sm:w-64">
                  {cursoDestacadoEnProgreso.thumbnail_url && (
                    <Image src={cursoDestacadoEnProgreso.thumbnail_url} alt="" fill className="object-cover" />
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-semibold text-portal-navy">{cursoDestacadoEnProgreso.titulo}</h3>
                    <span className="shrink-0 rounded-full bg-portal-orange/15 px-2 py-0.5 text-[10px] font-bold text-portal-orange">
                      {Math.round((cursoEnProgreso.completadas / cursoEnProgreso.total) * 100)}% COMPLETADO
                    </span>
                  </div>
                  <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-portal-surface-low">
                    <div
                      className="h-full rounded-full bg-portal-orange"
                      style={{ width: `${(cursoEnProgreso.completadas / cursoEnProgreso.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-portal-muted">
                    Lección {cursoEnProgreso.completadas} de {cursoEnProgreso.total}
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="rounded-full bg-portal-navy-dark px-6 py-2.5 text-sm font-semibold text-white">
                    Continuar
                  </span>
                </div>
              </Link>
            </div>
          )}

          <div className="mb-4 font-display text-lg font-semibold text-portal-navy">Cursos Destacados</div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cursosFiltrados.map((c) => (
              <Link
                key={c.id}
                href={`/mi-cuenta/cursos/${c.id}`}
                className="overflow-hidden rounded-2xl bg-white transition-transform hover:-translate-y-1"
              >
                <div className="relative aspect-video bg-portal-surface-low">
                  {c.thumbnail_url ? (
                    <Image src={c.thumbnail_url} alt="" fill className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-portal-muted">
                      <span className="material-symbols-rounded text-4xl">
                        {c.tipo === "video" ? "play_circle" : "article"}
                      </span>
                    </span>
                  )}
                  {c.es_gratis && (
                    <span className="absolute left-3 top-3 rounded-full bg-portal-teal-mid px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      Gratis
                    </span>
                  )}
                </div>
                <div className="p-4">
                  {c.categoria && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-portal-teal-mid">
                      {CATEGORIAS[c.categoria] ?? c.categoria}
                    </span>
                  )}
                  <h4 className="mt-1 font-display text-lg font-semibold leading-tight text-portal-navy">{c.titulo}</h4>
                  <div className="mt-3 flex items-center gap-4 text-xs text-portal-muted">
                    {c.duracion_min && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-rounded text-[14px]">schedule</span>
                        {c.duracion_min >= 60
                          ? `${Math.floor(c.duracion_min / 60)}h ${c.duracion_min % 60}m`
                          : `${c.duracion_min}m`}
                      </span>
                    )}
                  </div>
                  <span className="mt-4 block w-full rounded-full bg-portal-navy-dark py-2 text-center text-sm font-semibold text-white">
                    Ver curso
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl bg-portal-surface-low p-8 text-center sm:flex-row sm:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-portal-navy text-white">
              <span className="material-symbols-rounded text-2xl">workspace_premium</span>
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg font-semibold text-portal-navy">Obtén tu Certificado Suplevet</h3>
              <p className="mt-1 text-sm text-portal-muted">
                Al finalizar cualquier curso de nuestra academia, recibirás un certificado digital avalado por nuestro
                equipo de veterinarios.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
