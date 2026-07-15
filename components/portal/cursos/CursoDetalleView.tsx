"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { marcarLeccionCompletada, type CursoDetalle, type CursoLeccion } from "@/lib/cursos";

interface CursoDetalleViewProps {
  curso: CursoDetalle;
  leccionesCompletadasIniciales: string[];
}

const NIVEL_LABEL: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

function formatDuracion(min: number | null): string {
  if (!min) return "—";
  if (min >= 60) return `${Math.floor(min / 60)}h ${min % 60}m`;
  return `${min} min`;
}

export function CursoDetalleView({ curso, leccionesCompletadasIniciales }: CursoDetalleViewProps) {
  const [tab, setTab] = useState<"info" | "modulos" | "recursos">("info");
  const [completadas, setCompletadas] = useState<Set<string>>(new Set(leccionesCompletadasIniciales));

  const leccionesPlanas = useMemo(
    () => curso.modulos.flatMap((m) => m.lecciones.map((l) => ({ ...l, moduloTitulo: m.titulo }))),
    [curso.modulos]
  );

  const primeraNoCompletada = leccionesPlanas.find((l) => !completadas.has(l.id));
  const [leccionActualId, setLeccionActualId] = useState<string | null>(
    primeraNoCompletada?.id ?? leccionesPlanas[0]?.id ?? null
  );
  const leccionActual = leccionesPlanas.find((l) => l.id === leccionActualId) ?? leccionesPlanas[0] ?? null;
  const indiceActual = leccionActual ? leccionesPlanas.findIndex((l) => l.id === leccionActual.id) : -1;

  const total = leccionesPlanas.length;
  const totalCompletadas = leccionesPlanas.filter((l) => completadas.has(l.id)).length;
  const porcentaje = total > 0 ? Math.round((totalCompletadas / total) * 100) : 0;

  const siguiente = leccionesPlanas.find((l) => !completadas.has(l.id) && l.id !== leccionActualId) ?? null;

  function estaDesbloqueada(indice: number): boolean {
    if (indice <= 0) return true;
    return completadas.has(leccionesPlanas[indice - 1].id);
  }

  async function marcarCompletada(leccionId: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await marcarLeccionCompletada(supabase, user.id, leccionId);
    setCompletadas((prev) => new Set(prev).add(leccionId));
  }

  function abrirLeccion(l: CursoLeccion, indice: number) {
    if (!estaDesbloqueada(indice)) return;
    setLeccionActualId(l.id);
    setTab("info");
    if (l.video_url) window.open(l.video_url, "_blank", "noreferrer");
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/mi-cuenta/cursos"
          className="flex h-10 w-10 items-center justify-center rounded-full text-portal-navy hover:bg-portal-surface-low"
        >
          <span className="material-symbols-rounded">arrow_back</span>
        </Link>
        <div>
          <span className="block text-xs font-bold uppercase tracking-widest text-portal-orange">Curso Actual</span>
          <h2 className="font-display text-2xl font-semibold text-portal-navy">{curso.titulo}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Columna izquierda */}
        <div className="space-y-4 lg:col-span-8">
          {leccionActual?.video_url ? (
            <a
              href={leccionActual.video_url}
              target="_blank"
              rel="noreferrer"
              className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-[24px] bg-portal-navy"
            >
              {curso.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={curso.thumbnail_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
              )}
              <div className="relative z-10 flex flex-col items-center gap-2 text-white">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-portal-orange shadow-lg transition-transform group-hover:scale-110">
                  <span className="material-symbols-rounded text-4xl">play_arrow</span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                  Ver en Google Drive
                </span>
              </div>
            </a>
          ) : (
            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-[24px] bg-portal-navy">
              {curso.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={curso.thumbnail_url} alt="" className="h-full w-full object-cover opacity-80" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/40">
                  <span className="material-symbols-rounded text-6xl">play_circle</span>
                </div>
              )}
            </div>
          )}

          <div className="overflow-hidden rounded-[24px] bg-white">
            <div className="flex border-b border-portal-surface-low">
              {(
                [
                  ["info", "Información"],
                  ["modulos", "Módulos"],
                  ["recursos", "Recursos"],
                ] as const
              ).map(([valor, etiqueta]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setTab(valor)}
                  className={`flex-1 border-b-2 py-4 text-sm font-semibold transition-colors ${
                    tab === valor
                      ? "border-portal-orange bg-portal-surface-low text-portal-orange"
                      : "border-transparent text-portal-muted hover:text-portal-navy"
                  }`}
                >
                  {etiqueta}
                </button>
              ))}
            </div>

            <div className="p-5">
              {tab === "info" && leccionActual && (
                <div>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-semibold text-portal-navy">{leccionActual.titulo}</h3>
                    <div className="flex gap-2">
                      {curso.nivel && (
                        <span className="rounded-full bg-portal-teal-light/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-portal-teal-mid">
                          {NIVEL_LABEL[curso.nivel] ?? curso.nivel}
                        </span>
                      )}
                      {curso.etiqueta && (
                        <span className="rounded-full bg-portal-orange/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-portal-orange">
                          {curso.etiqueta}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mb-6 text-sm leading-relaxed text-portal-muted">
                    {leccionActual.contenido || curso.descripcion || "Sin descripción."}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <InfoTile icono="timer" etiqueta="Duración" valor={formatDuracion(leccionActual.duracion_min)} />
                    <InfoTile
                      icono="assignment"
                      etiqueta="Lección"
                      valor={total > 0 ? `${String(indiceActual + 1).padStart(2, "0")} de ${total}` : "—"}
                    />
                    <InfoTile icono="workspace_premium" etiqueta="Puntos" valor={`${curso.puntos_curso} pts`} />
                  </div>
                  {!completadas.has(leccionActual.id) && (
                    <button
                      type="button"
                      onClick={() => marcarCompletada(leccionActual.id)}
                      className="mt-5 rounded-full bg-portal-navy-dark px-6 py-2.5 text-sm font-semibold text-white hover:bg-portal-navy"
                    >
                      Marcar lección como completada
                    </button>
                  )}
                </div>
              )}

              {tab === "modulos" && (
                <div className="space-y-4">
                  {curso.modulos.length === 0 && (
                    <p className="text-sm text-portal-muted">Este curso aún no tiene módulos publicados.</p>
                  )}
                  {curso.modulos.map((modulo) => (
                    <div key={modulo.id} className="rounded-xl border border-portal-surface-variant">
                      <div className="flex items-center gap-2 border-b border-portal-surface-low bg-portal-surface-low/60 p-3">
                        <span className="material-symbols-rounded text-portal-navy">folder</span>
                        <p className="font-semibold text-portal-navy">{modulo.titulo}</p>
                      </div>
                      <div className="divide-y divide-portal-surface-low">
                        {modulo.lecciones.map((l) => {
                          const indice = leccionesPlanas.findIndex((x) => x.id === l.id);
                          const completada = completadas.has(l.id);
                          const desbloqueada = estaDesbloqueada(indice);
                          const esActual = l.id === leccionActualId;
                          return (
                            <button
                              type="button"
                              key={l.id}
                              onClick={() => abrirLeccion(l, indice)}
                              disabled={!desbloqueada}
                              className={`flex w-full items-center justify-between p-4 text-left transition-colors ${
                                esActual ? "bg-portal-orange/5" : "hover:bg-portal-surface-low/60"
                              } ${!desbloqueada ? "cursor-not-allowed opacity-60" : ""}`}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${
                                    completada ? "bg-portal-teal-mid" : esActual ? "bg-portal-orange" : "bg-portal-surface-variant text-portal-muted"
                                  }`}
                                >
                                  <span className="material-symbols-rounded text-sm">
                                    {completada ? "check" : desbloqueada ? "play_arrow" : "lock"}
                                  </span>
                                </span>
                                <div>
                                  <p className="font-bold text-portal-navy">{l.titulo}</p>
                                  <p className={`text-xs ${esActual ? "font-bold text-portal-orange" : "text-portal-muted"}`}>
                                    {completada ? "Completado" : esActual ? "En progreso" : desbloqueada ? "Disponible" : "Bloqueado"} ·{" "}
                                    {formatDuracion(l.duracion_min)}
                                  </p>
                                </div>
                              </div>
                              <span className="material-symbols-rounded text-portal-muted">
                                {desbloqueada ? "keyboard_arrow_right" : "lock"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === "recursos" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {curso.recursos.length === 0 && (
                    <p className="text-sm text-portal-muted">Sin materiales de apoyo por ahora.</p>
                  )}
                  {curso.recursos.map((r) => (
                    <a
                      key={r.id}
                      href={r.url ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-4 rounded-xl bg-portal-surface-low p-4 transition-shadow hover:shadow-md"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                        <span className={`material-symbols-rounded ${r.tipo === "descargable" ? "text-portal-error" : "text-portal-teal-mid"}`}>
                          {r.tipo === "descargable" ? "picture_as_pdf" : "fact_check"}
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-portal-navy">{r.titulo}</p>
                        <p className="text-[10px] uppercase text-portal-muted">
                          {formatDuracion(r.duracion_min)} · {r.tipo === "descargable" ? "Descargar" : "Leer"}
                        </p>
                      </div>
                      <span className="material-symbols-rounded text-portal-muted">
                        {r.tipo === "descargable" ? "download" : "chevron_right"}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-4 lg:col-span-4">
          {siguiente && (
            <div className="relative overflow-hidden rounded-[24px] bg-portal-navy p-6 text-white">
              <span className="material-symbols-rounded pointer-events-none absolute -bottom-8 -right-8 rotate-[-12deg] text-[140px] text-white/10">
                restaurant
              </span>
              <div className="relative z-10">
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-portal-orange" />
                  <span className="text-xs font-bold uppercase tracking-widest text-portal-orange">Siguiente lección</span>
                </div>
                <h4 className="mb-2 font-display text-lg font-semibold leading-tight">{siguiente.titulo}</h4>
                <p className="mb-6 text-sm text-white/70">{siguiente.contenido?.slice(0, 90) || "Continúa tu aprendizaje."}</p>
                <button
                  type="button"
                  onClick={() => {
                    setLeccionActualId(siguiente.id);
                    if (siguiente.video_url) window.open(siguiente.video_url, "_blank", "noreferrer");
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-portal-orange py-3 text-sm font-semibold text-white hover:bg-portal-orange-dark"
                >
                  REPRODUCIR <span className="material-symbols-rounded">play_circle</span>
                </button>
              </div>
            </div>
          )}

          <div className="rounded-[24px] bg-white p-6">
            <h5 className="mb-4 font-display text-lg text-portal-navy">Material de apoyo</h5>
            {curso.recursos.length === 0 ? (
              <p className="text-xs text-portal-muted">Sin materiales aún.</p>
            ) : (
              <div className="space-y-3">
                {curso.recursos.slice(0, 2).map((r) => (
                  <a
                    key={r.id}
                    href={r.url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className={`block rounded-r-xl border-l-4 bg-portal-surface-low p-3 transition-colors hover:bg-portal-surface-variant ${
                      r.tipo === "descargable" ? "border-portal-orange" : "border-portal-teal-light"
                    }`}
                  >
                    <p className="mb-1 text-xs font-bold text-portal-muted">
                      {r.tipo === "descargable" ? "DESCARGABLE" : "LECTURA SUGERIDA"}
                    </p>
                    <p className="text-sm font-bold text-portal-navy">{r.titulo}</p>
                  </a>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setTab("recursos")}
              className="mt-6 w-full rounded-xl border-2 border-portal-surface-low py-3 text-sm font-semibold text-portal-muted hover:border-portal-orange hover:text-portal-orange"
            >
              Ver todos los archivos
            </button>
          </div>

          <div className="rounded-[24px] border border-white bg-portal-surface-low p-6">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-portal-muted">Tu progreso</p>
                <p className="font-display text-2xl text-portal-navy">{porcentaje}% completado</p>
              </div>
              <span className="font-bold text-portal-orange">
                {totalCompletadas}/{total}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-portal-surface-variant">
              <div
                className="h-full rounded-full bg-gradient-to-r from-portal-orange to-portal-orange-dark"
                style={{ width: `${porcentaje}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icono, etiqueta, valor }: { icono: string; etiqueta: string; valor: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-portal-surface-low p-4">
      <span className="material-symbols-rounded text-portal-orange">{icono}</span>
      <div>
        <p className="text-[10px] font-bold uppercase text-portal-muted">{etiqueta}</p>
        <p className="font-bold text-portal-navy">{valor}</p>
      </div>
    </div>
  );
}
