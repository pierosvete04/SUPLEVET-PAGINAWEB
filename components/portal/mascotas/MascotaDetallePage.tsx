"use client";

import { useEffect, useState } from "react";
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

      {/* Encabezado exclusivo de impresión/PDF — la ficha debe identificar a
          Suplevet y la fecha de generación cuando se lleva impresa al veterinario. */}
      <div className="mb-6 hidden items-center justify-between border-b border-portal-surface-variant pb-4 print:flex">
        <div className="flex items-center gap-2">
          <Image src="/logos/icon-only/icon-outline-celeste.png" alt="Suplevet" width={32} height={32} />
          <span className="font-display text-lg font-semibold text-portal-navy">Suplevet</span>
        </div>
        <div className="text-right text-xs text-portal-muted">
          <p className="font-semibold text-portal-navy">Ficha de {mascota.nombre}</p>
          <p>
            Generada el{" "}
            {new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-[8px] bg-portal-navy p-6 text-white">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-4 right-16 h-16 w-16 rounded-full bg-white/5" />
        <div className="relative z-10 flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/30 bg-portal-orange">
            {mascota.foto_url ? (
              <Image src={mascota.foto_url} alt={mascota.nombre} width={80} height={80} className="h-full w-full object-cover" />
            ) : (
              <Image src="/logos/icon-only/icon-outline-white.png" alt="" width={38} height={38} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl font-semibold">{mascota.nombre}</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  mascota.activa
                    ? "bg-portal-teal-light/30 text-portal-teal-light"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {mascota.activa ? "Activo" : "Inactivo"}
              </span>
            </div>
            <p className="text-sm text-white/80">
              {[mascota.raza, mascota.fecha_nacimiento ? calcularEdad(mascota.fecha_nacimiento) : null, mascota.genero === "macho" ? "Macho" : mascota.genero === "hembra" ? "Hembra" : null]
                .filter(Boolean)
                .join(" • ")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs">
                <span className="material-symbols-rounded text-[14px]">monitor_weight</span>
                {mascota.peso_kg} kg
              </span>
              {mascota.fecha_nacimiento && (
                <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs">
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
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
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
          <p className="relative z-10 mt-4 max-w-2xl text-sm leading-relaxed text-white/85">{mascota.descripcion}</p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 print:mt-3 print:gap-3 lg:grid-cols-3">
        <div className="space-y-4 print:space-y-3 lg:col-span-2">
          {vacunaVencidaDias !== null && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-portal-error/20 bg-red-50 p-4 print:hidden">
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
          <div className="rounded-[8px] border border-portal-surface-variant bg-white p-5 print:break-inside-avoid print:p-3">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-portal-navy">
                <span className="material-symbols-rounded text-portal-teal-mid">medical_services</span> Estado de Salud
              </h3>
              <button
                type="button"
                onClick={() => abrirNuevoRegistro("vacuna")}
                className="flex items-center gap-1 text-sm font-semibold text-portal-teal-mid hover:text-portal-teal print:hidden"
              >
                <span className="material-symbols-rounded text-[18px]">add_circle</span> Agregar registro
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <EventoResumenCard
                titulo="Vacuna"
                evento={vacunas[0]}
                vacio="Aún no hay vacunas"
                onAgregar={() => abrirNuevoRegistro("vacuna")}
                onEditar={(e) => {
                  setEventoEditar(e);
                  setFormSaludAbierto(true);
                }}
              />
              <EventoResumenCard
                titulo="Desparasitación"
                evento={desparasitaciones[0]}
                vacio="Aún no hay desparasitaciones"
                onAgregar={() => abrirNuevoRegistro("desparasitacion")}
                onEditar={(e) => {
                  setEventoEditar(e);
                  setFormSaludAbierto(true);
                }}
              />
              <EventoResumenCard
                titulo="Consulta vet."
                evento={consultas[0]}
                vacio="Aún no hay consultas"
                onAgregar={() => abrirNuevoRegistro("consulta")}
                onEditar={(e) => {
                  setEventoEditar(e);
                  setFormSaludAbierto(true);
                }}
              />
              <EventoResumenCard
                titulo="Medicamento"
                evento={medicamentos[0]}
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
          <div className="rounded-[8px] border border-portal-surface-variant bg-white p-5 print:break-inside-avoid print:p-3">
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
            </div>
            {mascota.historia && (
              <div className="mt-4 rounded-[8px] bg-red-50 p-4">
                <div className="mb-1 flex items-center gap-2 text-sm font-bold text-portal-navy">
                  <span className="material-symbols-rounded text-[16px] text-portal-error">healing</span>
                  Condiciones Médicas
                </div>
                <p className="text-sm text-portal-muted">{mascota.historia}</p>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-4">
          {/* Mezcla eventos de salud con transacciones de SuplePoints ("+40 pts") —
              relevante en el panel, pero fuera de lugar en una ficha para el
              veterinario, así que no se imprime. */}
          <div className="rounded-[8px] border border-portal-surface-variant bg-white p-5 print:hidden">
            <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-portal-navy">
              <span className="material-symbols-rounded text-[18px] text-portal-navy">history</span> Actividad Reciente
            </h3>
            {cargando ? (
              <p className="text-sm text-portal-muted">Cargando…</p>
            ) : actividad.length === 0 ? (
              <p className="text-xs text-portal-muted">Aún no hay actividad para mostrar</p>
            ) : (
              <div className="space-y-3">
                {actividad.map((a, i) => (
                  <div key={i}>
                    <p className="text-sm font-semibold text-portal-navy">{a.titulo}</p>
                    <p className="text-xs text-portal-muted">
                      {a.sub} · {formatFecha(a.fecha)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[8px] bg-portal-teal-light/20 p-5 print:hidden">
            <h3 className="mb-1 font-display text-base font-semibold text-portal-navy">
              Lleva la ficha de {mascota.nombre} a su próxima consulta
            </h3>
            <p className="mb-4 text-xs text-portal-muted">
              Descárgala en PDF o comparte el enlace con tu veterinario. Cualquier persona con el
              enlace podrá ver esta ficha, sin necesidad de iniciar sesión.
            </p>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 bg-portal-navy-dark text-white hover:bg-portal-navy" onClick={() => window.print()}>
                Descargar PDF
              </Button>
              <Button size="sm" variant="secondary" className="flex-1" onClick={copiarEnlace}>
                {enlaceCopiado ? "¡Copiado!" : "Copiar enlace"}
              </Button>
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

function EventoResumenCard({
  titulo,
  evento,
  vacio,
  onAgregar,
  onEditar,
}: {
  titulo: string;
  evento?: MascotaEvento;
  vacio: string;
  onAgregar: () => void;
  onEditar: (e: MascotaEvento) => void;
}) {
  if (!evento) {
    return (
      <button
        type="button"
        onClick={onAgregar}
        className="flex min-h-[110px] flex-col items-center justify-center gap-1 rounded-[8px] border border-dashed border-portal-surface-variant bg-portal-surface-low/40 p-4 text-center hover:bg-portal-surface-low"
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
      className="flex flex-col rounded-[8px] bg-portal-surface-low p-4 text-left"
    >
      <span
        className={`mb-2 self-start rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
          vencido ? "bg-red-100 text-portal-error" : "bg-portal-teal-light/40 text-portal-teal"
        }`}
      >
        {vencido ? "Vencido" : titulo}
      </span>
      <p className="text-sm font-bold text-portal-navy">{evento.titulo}</p>
      <p className="text-xs text-portal-muted">
        {vencido ? "Vencido" : "Aplicada"}: {formatFecha(evento.fecha)}
      </p>
    </button>
  );
}

function InfoTile({ etiqueta, valor, icono }: { etiqueta: string; valor: string; icono: string }) {
  return (
    <div className="rounded-[8px] bg-portal-surface-low p-3">
      <span className="material-symbols-rounded text-[18px] text-portal-orange">{icono}</span>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-portal-muted">{etiqueta}</p>
      <p className="truncate text-sm font-bold text-portal-navy">{valor}</p>
    </div>
  );
}
