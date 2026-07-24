"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calcularEdad, formatFecha, formatFechaCumple } from "@/lib/portal/formato";
import type { Mascota, MascotaEvento, TipoEventoSalud } from "@/lib/data/portal/mascotas";
import { parseDetalleEventoSalud } from "@/lib/data/portal/mascotas";
import { Button } from "@/components/ui/button";
import { MascotaFormDialog } from "@/components/portal/mascotas/MascotaFormDialog";
import { SaludEventoFormDialog } from "@/components/portal/mascotas/SaludEventoFormDialog";
import { CondicionesMedicasCard } from "@/components/portal/mascotas/CondicionesMedicasCard";
import { CondicionMedicaFormDialog } from "@/components/portal/mascotas/CondicionMedicaFormDialog";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { FichaDocumentoImprimible } from "@/components/ficha/FichaDocumentoImprimible";

interface TransaccionMini {
  id: string;
  accion: string;
  descripcion: string | null;
  puntos: number;
  created_at: string;
}

interface MascotaDetallePageProps {
  clienteId: string;
  mascota: Mascota;
}

const parseDetalle = parseDetalleEventoSalud;

export function MascotaDetallePage({ clienteId, mascota }: MascotaDetallePageProps) {
  const router = useRouter();
  const [eventos, setEventos] = useState<MascotaEvento[]>([]);
  const [transacciones, setTransacciones] = useState<TransaccionMini[]>([]);
  const [cargando, setCargando] = useState(true);
  const [eventoEditar, setEventoEditar] = useState<MascotaEvento | null>(null);
  const [tipoNuevoEvento, setTipoNuevoEvento] = useState<TipoEventoSalud>("vacuna");
  const [formSaludAbierto, setFormSaludAbierto] = useState(false);
  const [formMascotaAbierto, setFormMascotaAbierto] = useState(false);
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);
  const [condicionIndexEditar, setCondicionIndexEditar] = useState<number | null>(null);
  const [formCondicionAbierto, setFormCondicionAbierto] = useState(false);

  const redesSociales = [
    { url: mascota.instagram_url, icono: "/icons/social/instagram.png", label: "Instagram" },
    { url: mascota.facebook_url, icono: "/icons/social/facebook.png", label: "Facebook" },
    { url: mascota.tiktok_url, icono: "/icons/social/tiktok.png", label: "TikTok" },
  ].filter((red): red is { url: string; icono: string; label: string } => Boolean(red.url));

  async function cargarDatos() {
    setCargando(true);
    const supabase = createClient();
    const [{ data: ev }, { data: tx }] = await Promise.all([
      supabase.from("mascota_eventos").select("*").eq("mascota_id", mascota.id).order("fecha", { ascending: false }),
      supabase
        .from("suplepuntos_transacciones")
        .select("id, accion, descripcion, puntos, created_at")
        .eq("cliente_id", clienteId)
        .eq("mascota_id", mascota.id)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);
    setEventos(ev ?? []);
    setTransacciones(tx ?? []);
    setCargando(false);
  }

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mascota.id]);

  function abrirNuevoRegistro(tipo: TipoEventoSalud) {
    setEventoEditar(null);
    setTipoNuevoEvento(tipo);
    setFormSaludAbierto(true);
  }

  function copiarEnlace() {
    const url = `${window.location.origin}/ficha/${mascota.id}`;
    navigator.clipboard.writeText(url);
    setEnlaceCopiado(true);
    setTimeout(() => setEnlaceCopiado(false), 2000);
  }

  const vacunas = eventos.filter((e) => e.tipo === "vacuna");
  const desparasitaciones = eventos.filter((e) => e.tipo === "desparasitacion");
  const consultas = eventos.filter((e) => e.tipo === "consulta");
  const medicamentos = eventos.filter((e) => e.tipo === "medicamento");

  const ultimaVacuna = vacunas[0];
  const detalleUltimaVacuna = ultimaVacuna ? parseDetalle(ultimaVacuna.detalle) : null;
  const vacunaVencidaDias =
    detalleUltimaVacuna?.proxima_fecha && new Date(detalleUltimaVacuna.proxima_fecha) < new Date()
      ? Math.floor((Date.now() - new Date(detalleUltimaVacuna.proxima_fecha).getTime()) / 86400000)
      : null;

  const actividad = [
    ...eventos.map((e) => ({ fecha: e.fecha, titulo: e.titulo, sub: TIPOS_SALUD_LABEL[e.tipo] })),
    ...transacciones.map((t) => ({ fecha: t.created_at, titulo: t.descripcion || t.accion, sub: `${t.puntos > 0 ? "+" : ""}${t.puntos} pts` })),
  ]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 5);

  return (
    <div>
      <Link
        href="/mi-cuenta/mascotas"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-portal-navy hover:text-portal-teal-mid print:hidden"
      >
        <span className="material-symbols-rounded text-[18px]">arrow_back</span>
        Mis Mascotas
      </Link>

      {/* Documento de impresión/PDF — solo visible al imprimir, con su propio
          diseño de ficha clínica (historial completo agrupado por tipo). */}
      <FichaDocumentoImprimible mascota={mascota} eventos={eventos} />

      {/* Hero */}
      <div
        className={`relative overflow-hidden rounded-[17px] p-6 text-[var(--mc-text)] shadow-[0_20px_40px_rgba(30,58,95,0.2)] print:hidden ${
          mascota.color_primario ? "" : "bg-gradient-to-br from-portal-navy to-portal-navy-dark"
        }`}
        style={
          {
            ...(mascota.color_primario
              ? {
                  background: mascota.color_secundario
                    ? `linear-gradient(135deg, ${mascota.color_primario}, ${mascota.color_secundario})`
                    : mascota.color_primario,
                }
              : {}),
            "--mc-text": mascota.color_texto || "#ffffff",
            "--mc-tag": mascota.color_etiqueta || mascota.color_texto || "#ffffff",
          } as CSSProperties
        }
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-portal-teal-mid/20 blur-2xl" />
        <div className="pointer-events-none absolute bottom-2 right-24 h-16 w-16 rounded-full bg-[color-mix(in_srgb,var(--mc-text)_5%,transparent)]" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-portal-orange via-portal-teal-light to-portal-teal-mid" />
        <div className="relative z-10 flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-portal-orange to-portal-orange-dark p-[3px] shadow-lg">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-portal-navy-dark bg-portal-orange">
              {mascota.foto_url ? (
                <Image src={mascota.foto_url} alt={mascota.nombre} width={80} height={80} className="h-full w-full object-cover" />
              ) : (
                <Image src="/logos/icon-only/icon-outline-white.png" alt="" width={38} height={38} />
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl font-semibold">{mascota.nombre}</h2>
              <span className="flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--mc-tag)_18%,transparent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--mc-tag)]">
                <span className={`h-1.5 w-1.5 rounded-full ${mascota.activa ? "bg-portal-teal-light" : "bg-[color-mix(in_srgb,var(--mc-tag)_60%,transparent)]"}`} />
                {mascota.activa ? "Activo" : "Inactivo"}
              </span>
            </div>
            <p className="text-sm opacity-80">
              {[mascota.raza, mascota.fecha_nacimiento ? calcularEdad(mascota.fecha_nacimiento) : null, mascota.genero === "macho" ? "Macho" : mascota.genero === "hembra" ? "Hembra" : null]
                .filter(Boolean)
                .join(" • ")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--mc-tag)_18%,transparent)] px-3 py-1 text-xs text-[var(--mc-tag)]">
                <span className="material-symbols-rounded text-[14px]">monitor_weight</span>
                {mascota.peso_kg} kg
              </span>
              {mascota.fecha_nacimiento && (
                <span className="flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--mc-tag)_18%,transparent)] px-3 py-1 text-xs text-[var(--mc-tag)]">
                  <span className="material-symbols-rounded text-[14px]">cake</span>
                  {formatFechaCumple(mascota.fecha_nacimiento)}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 print:hidden">
            {redesSociales.map((red) => (
              <a
                key={red.label}
                href={red.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${red.label} de ${mascota.nombre}`}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--mc-text)_12%,transparent)] transition-colors hover:bg-[color-mix(in_srgb,var(--mc-text)_22%,transparent)]"
              >
                <Image src={red.icono} alt="" width={16} height={16} />
              </a>
            ))}
            <button
              type="button"
              onClick={() => setFormMascotaAbierto(true)}
              aria-label="Editar perfil de la mascota"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-portal-orange text-white transition-colors hover:bg-portal-orange-dark"
            >
              <span className="material-symbols-rounded text-[18px]">settings</span>
            </button>
          </div>
        </div>

        {mascota.descripcion && (
          <p className="relative z-10 mt-4 max-w-2xl text-sm leading-relaxed opacity-85">{mascota.descripcion}</p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 print:hidden lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {vacunaVencidaDias !== null && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[17px] border border-portal-error/20 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-rounded mt-0.5 text-portal-error">error</span>
                <div>
                  <p className="font-bold text-portal-navy">Atención: recordatorio pendiente</p>
                  <p className="text-sm text-portal-muted">
                    La vacuna <strong>{ultimaVacuna?.titulo}</strong> está vencida hace{" "}
                    <strong>{vacunaVencidaDias} días</strong>.
                  </p>
                </div>
              </div>
              <Button size="sm" className="bg-portal-navy-dark text-white hover:bg-portal-navy" onClick={() => abrirNuevoRegistro("vacuna")}>
                Registrar refuerzo
              </Button>
            </div>
          )}

          {/* Estado de salud */}
          <div className="rounded-[17px] border border-portal-surface-variant bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-portal-navy">
                <span className="material-symbols-rounded text-portal-teal-mid">medical_services</span> Estado de Salud
              </h3>
              <button
                type="button"
                onClick={() => abrirNuevoRegistro("vacuna")}
                className="flex items-center gap-1 text-sm font-semibold text-portal-teal-mid hover:text-portal-teal"
              >
                <span className="material-symbols-rounded text-[18px]">add_circle</span> Agregar registro
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <EventoResumenCard
                titulo="Vacuna"
                icono="vaccines"
                acento="teal"
                evento={vacunas[0]}
                total={vacunas.length}
                vacio="Aún no hay vacunas"
                onAgregar={() => abrirNuevoRegistro("vacuna")}
                onEditar={(e) => {
                  setEventoEditar(e);
                  setFormSaludAbierto(true);
                }}
              />
              <EventoResumenCard
                titulo="Desparasitación"
                icono="bug_report"
                acento="orange"
                evento={desparasitaciones[0]}
                total={desparasitaciones.length}
                vacio="Aún no hay desparasitaciones"
                onAgregar={() => abrirNuevoRegistro("desparasitacion")}
                onEditar={(e) => {
                  setEventoEditar(e);
                  setFormSaludAbierto(true);
                }}
              />
              <EventoResumenCard
                titulo="Consulta vet."
                icono="stethoscope"
                acento="navy"
                evento={consultas[0]}
                total={consultas.length}
                vacio="Aún no hay consultas"
                onAgregar={() => abrirNuevoRegistro("consulta")}
                onEditar={(e) => {
                  setEventoEditar(e);
                  setFormSaludAbierto(true);
                }}
              />
              <EventoResumenCard
                titulo="Medicamento"
                icono="pill"
                acento="orange"
                evento={medicamentos[0]}
                total={medicamentos.length}
                vacio="Sin medicamentos activos ahora"
                onAgregar={() => abrirNuevoRegistro("medicamento")}
                onEditar={(e) => {
                  setEventoEditar(e);
                  setFormSaludAbierto(true);
                }}
              />
            </div>
          </div>

          {/* Información general */}
          <div className="rounded-[17px] border border-portal-surface-variant bg-white p-5">
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-portal-navy">
              <span className="material-symbols-rounded text-portal-navy">description</span> Información General
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <InfoTile
                etiqueta="Especie"
                valor={
                  mascota.especie === "perro"
                    ? "Perro"
                    : mascota.especie === "gato"
                      ? "Gato"
                      : mascota.especie_otro || "Otro"
                }
                icono="category"
              />
              <InfoTile etiqueta="Raza" valor={mascota.raza || "—"} icono="pets" />
              <InfoTile
                etiqueta="Edad"
                valor={mascota.fecha_nacimiento ? calcularEdad(mascota.fecha_nacimiento) : "—"}
                icono="calendar_month"
              />
              <InfoTile
                etiqueta="Sexo"
                valor={mascota.genero === "macho" ? "Macho" : mascota.genero === "hembra" ? "Hembra" : "—"}
                icono="wc"
              />
              {mascota.familiares.map((familiar, i) => (
                <InfoTile key={i} etiqueta={familiar.relacion} valor={familiar.nombre} icono="diversity_3" />
              ))}
            </div>
            <CondicionesMedicasCard
              condiciones={mascota.condiciones_medicas}
              onAgregar={() => {
                setCondicionIndexEditar(null);
                setFormCondicionAbierto(true);
              }}
              onEditar={(i) => {
                setCondicionIndexEditar(i);
                setFormCondicionAbierto(true);
              }}
            />
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-4">
          {/* Mezcla eventos de salud con transacciones de SuplePoints ("+40 pts") —
              relevante en el panel, pero fuera de lugar en una ficha para el
              veterinario, así que no se imprime. */}
          <div className="rounded-[17px] border border-portal-surface-variant bg-white p-5 print:hidden">
            <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-portal-navy">
              <span className="material-symbols-rounded text-[18px] text-portal-navy">history</span> Actividad Reciente
            </h3>
            {cargando ? (
              <BrandedLoader compact />
            ) : actividad.length === 0 ? (
              <p className="text-xs text-portal-muted">Aún no hay actividad para mostrar</p>
            ) : (
              <div className="space-y-3">
                {actividad.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-portal-teal-mid" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-portal-navy">{a.titulo}</p>
                      <p className="text-xs text-portal-muted">
                        {a.sub} · {formatFecha(a.fecha)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-[17px] bg-gradient-to-br from-portal-teal-light/30 to-portal-teal-light/10 p-5 print:hidden">
            <span className="material-symbols-rounded absolute -bottom-3 -right-3 text-[90px] text-portal-teal-mid/10">description</span>
            <div className="relative">
              <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-portal-teal">
                <span className="material-symbols-rounded text-[13px]">history_edu</span> Historial clínico completo
              </span>
              <h3 className="mb-1 font-display text-base font-semibold text-portal-navy">
                Lleva la ficha de {mascota.nombre} a su próxima consulta
              </h3>
              <p className="mb-4 text-xs text-portal-muted">
                El PDF incluye todo el historial de vacunas, desparasitaciones, consultas y medicamentos, listo para
                compartir con tu veterinario. Cualquier persona con el enlace podrá verla, sin iniciar sesión.
              </p>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-portal-navy-dark text-white hover:bg-portal-navy" onClick={() => window.print()}>
                  Descargar PDF
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1 bg-white text-portal-navy hover:bg-white/80"
                  onClick={copiarEnlace}
                >
                  {enlaceCopiado ? "¡Copiado!" : "Copiar enlace"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MascotaFormDialog
        clienteId={clienteId}
        mascota={mascota}
        open={formMascotaAbierto}
        onClose={() => setFormMascotaAbierto(false)}
        onSaved={() => {
          setFormMascotaAbierto(false);
          router.refresh();
        }}
        onEliminada={() => {
          router.push("/mi-cuenta/mascotas");
        }}
      />

      <SaludEventoFormDialog
        clienteId={clienteId}
        mascotaId={mascota.id}
        evento={eventoEditar}
        tipoInicial={tipoNuevoEvento}
        open={formSaludAbierto}
        onClose={() => setFormSaludAbierto(false)}
        onSaved={() => {
          setFormSaludAbierto(false);
          cargarDatos();
          router.refresh();
        }}
      />

      <CondicionMedicaFormDialog
        mascotaId={mascota.id}
        condicionesActuales={mascota.condiciones_medicas}
        indexEditar={condicionIndexEditar}
        open={formCondicionAbierto}
        onClose={() => setFormCondicionAbierto(false)}
        onSaved={() => {
          setFormCondicionAbierto(false);
          router.refresh();
        }}
      />
    </div>
  );
}

const TIPOS_SALUD_LABEL: Record<TipoEventoSalud, string> = {
  vacuna: "Vacuna",
  desparasitacion: "Desparasitación",
  consulta: "Consulta vet.",
  medicamento: "Medicamento",
  bano: "Baño / Grooming",
  otro: "Otro cuidado",
};

const ACENTO_ESTILOS: Record<string, { icono: string; texto: string; fondo: string }> = {
  teal: { icono: "text-portal-teal-mid", texto: "text-portal-teal", fondo: "bg-portal-teal-light/40" },
  orange: { icono: "text-portal-orange-dark", texto: "text-portal-orange-dark", fondo: "bg-portal-orange/15" },
  navy: { icono: "text-portal-navy", texto: "text-portal-navy", fondo: "bg-portal-navy/10" },
};

function EventoResumenCard({
  titulo,
  icono,
  acento,
  evento,
  total = 0,
  vacio,
  onAgregar,
  onEditar,
}: {
  titulo: string;
  icono: string;
  acento: "teal" | "orange" | "navy";
  evento?: MascotaEvento;
  total?: number;
  vacio: string;
  onAgregar: () => void;
  onEditar: (e: MascotaEvento) => void;
}) {
  const estilo = ACENTO_ESTILOS[acento];

  if (!evento) {
    return (
      <button
        type="button"
        onClick={onAgregar}
        className="flex min-h-[122px] flex-col items-center justify-center gap-1 rounded-[17px] border border-dashed border-portal-surface-variant bg-portal-surface-low/40 p-4 text-center transition-colors hover:border-portal-teal-light hover:bg-portal-surface-low"
      >
        <span className="material-symbols-rounded text-2xl text-portal-muted">add_circle</span>
        <span className="text-xs text-portal-muted">{vacio}</span>
      </button>
    );
  }

  const detalle = parseDetalle(evento.detalle);
  const vencido = detalle.proxima_fecha && new Date(detalle.proxima_fecha) < new Date();

  return (
    <button
      type="button"
      onClick={() => onEditar(evento)}
      className="group flex flex-col rounded-[17px] bg-portal-surface-low p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${estilo.fondo} ${estilo.texto}`}>
          <span className={`material-symbols-rounded text-[13px] ${estilo.icono}`}>{icono}</span>
          {titulo}
        </span>
        {total > 1 && (
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-portal-muted">
            {total} registros
          </span>
        )}
      </div>
      <p className="text-sm font-bold text-portal-navy">{evento.titulo}</p>
      {detalle.producto && <p className="text-xs text-portal-muted">{detalle.producto}</p>}
      <p className="mt-1 text-xs text-portal-muted">Aplicada: {formatFecha(evento.fecha)}</p>
      {detalle.veterinario && (
        <p className="text-xs text-portal-muted">
          <span className="material-symbols-rounded align-middle text-[13px]">badge</span> {detalle.veterinario}
        </p>
      )}
      {detalle.proxima_fecha && (
        <span
          className={`mt-2 inline-flex w-fit items-center gap-1 self-start rounded-full px-2 py-0.5 text-[10px] font-bold ${
            vencido ? "bg-red-100 text-portal-error" : "bg-portal-teal-light/40 text-portal-teal"
          }`}
        >
          <span className="material-symbols-rounded text-[12px]">{vencido ? "error" : "event_available"}</span>
          {vencido ? "Vencido" : "Próximo"}: {formatFecha(detalle.proxima_fecha)}
        </span>
      )}
    </button>
  );
}

function InfoTile({ etiqueta, valor, icono }: { etiqueta: string; valor: string; icono: string }) {
  return (
    <div className="rounded-[17px] bg-portal-surface-low p-3 transition-colors hover:bg-portal-teal-light/20">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-portal-orange/15">
        <span className="material-symbols-rounded text-[18px] text-portal-orange-dark">{icono}</span>
      </span>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-portal-muted">{etiqueta}</p>
      <p className="truncate text-sm font-bold text-portal-navy">{valor}</p>
    </div>
  );
}
