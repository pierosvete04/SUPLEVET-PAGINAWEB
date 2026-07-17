import Image from "next/image";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { calcularEdad, formatFecha, formatFechaCumple } from "@/lib/portal/formato";
import { parseDetalleEventoSalud, type TipoEventoSalud } from "@/lib/data/portal/mascotas";
import { FichaPrintButton } from "@/components/ficha/FichaPrintButton";
import "@/app/mi-cuenta/(portal)/portal-theme.css";

// Página pública, sin sesión — cualquiera con el enlace puede verla. Por eso
// solo selecciona columnas seguras para compartir (nunca cliente_id) y usa el
// cliente con Service Role (lib/supabase/admin.ts) para leer sin RLS de
// usuario, ya que un visitante externo (veterinario) no tiene auth.uid().
export const dynamic = "force-dynamic";

interface EventoPublico {
  id: string;
  tipo: TipoEventoSalud;
  titulo: string;
  detalle: string | null;
  fecha: string;
}

const TIPOS_LABEL: Record<TipoEventoSalud, string> = {
  vacuna: "Vacuna",
  desparasitacion: "Desparasitación",
  consulta: "Consulta vet.",
  medicamento: "Medicamento",
  bano: "Baño / Grooming",
  otro: "Otro cuidado",
};

export default async function FichaPublicaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: mascota } = await supabase
    .from("mascotas")
    .select(
      "id, nombre, especie, especie_otro, raza, fecha_nacimiento, peso_kg, genero, historia, descripcion, foto_url, activa"
    )
    .eq("id", id)
    .maybeSingle();

  if (!mascota || !mascota.activa) notFound();

  const { data: eventosData } = await supabase
    .from("mascota_eventos")
    .select("id, tipo, titulo, detalle, fecha")
    .eq("mascota_id", id)
    .order("fecha", { ascending: false });

  const eventos = (eventosData ?? []) as EventoPublico[];
  const porTipo = (tipo: TipoEventoSalud) => eventos.find((e) => e.tipo === tipo);

  return (
    <div className="portal-shell min-h-screen p-4 md:p-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between border-b border-portal-surface-variant pb-4">
          <div className="flex items-center gap-2">
            <Image src="/logos/icon-only/icon-outline-celeste.png" alt="Suplevet" width={32} height={32} />
            <span className="font-display text-lg font-semibold text-portal-navy">Suplevet</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right text-xs text-portal-muted sm:block">
              Ficha clínica · generada el{" "}
              {new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}
            </span>
            <FichaPrintButton />
          </div>
        </div>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-[17px] bg-portal-navy p-6 text-white">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative z-10 flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/30 bg-portal-orange">
              {mascota.foto_url ? (
                <Image src={mascota.foto_url} alt={mascota.nombre} width={80} height={80} className="h-full w-full object-cover" />
              ) : (
                <Image src="/logos/icon-only/icon-outline-white.png" alt="" width={38} height={38} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl font-semibold">{mascota.nombre}</h2>
              <p className="text-sm text-white/80">
                {[
                  mascota.raza,
                  mascota.fecha_nacimiento ? calcularEdad(mascota.fecha_nacimiento) : null,
                  mascota.genero === "macho" ? "Macho" : mascota.genero === "hembra" ? "Hembra" : null,
                ]
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
          </div>

          {mascota.descripcion && (
            <p className="relative z-10 mt-4 max-w-2xl text-sm leading-relaxed text-white/85">{mascota.descripcion}</p>
          )}
        </div>

        {/* Estado de salud */}
        <div className="mt-4 rounded-[17px] border border-portal-surface-variant bg-white p-5 print:break-inside-avoid print:p-3">
          <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-portal-navy">
            <span className="material-symbols-rounded text-portal-teal-mid">medical_services</span> Estado de Salud
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <EventoTile titulo="Vacuna" evento={porTipo("vacuna")} vacio="Sin vacunas registradas" />
            <EventoTile titulo="Desparasitación" evento={porTipo("desparasitacion")} vacio="Sin registros" />
            <EventoTile titulo="Consulta vet." evento={porTipo("consulta")} vacio="Sin consultas registradas" />
            <EventoTile titulo="Medicamento" evento={porTipo("medicamento")} vacio="Sin medicamentos activos" />
          </div>
        </div>

        {/* Información general */}
        <div className="mt-4 rounded-[17px] border border-portal-surface-variant bg-white p-5 print:break-inside-avoid print:p-3">
          <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-portal-navy">
            <span className="material-symbols-rounded text-portal-navy">description</span> Información General
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoTile
              etiqueta="Especie"
              valor={mascota.especie === "perro" ? "Perro" : mascota.especie === "gato" ? "Gato" : mascota.especie_otro || "Otro"}
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
            <div className="mt-4 rounded-[17px] bg-red-50 p-4">
              <div className="mb-1 flex items-center gap-2 text-sm font-bold text-portal-navy">
                <span className="material-symbols-rounded text-[16px] text-portal-error">healing</span>
                Condiciones Médicas
              </div>
              <p className="text-sm text-portal-muted">{mascota.historia}</p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-portal-muted print:hidden">
          Ficha pública generada por Suplevet. No incluye datos de la cuenta del cliente.
        </p>
      </div>
    </div>
  );
}

function EventoTile({ titulo, evento, vacio }: { titulo: string; evento?: EventoPublico; vacio: string }) {
  if (!evento) {
    return (
      <div className="flex min-h-[90px] flex-col items-center justify-center gap-1 rounded-[17px] border border-dashed border-portal-surface-variant bg-portal-surface-low/40 p-4 text-center">
        <span className="text-xs text-portal-muted">{vacio}</span>
      </div>
    );
  }

  const detalle = parseDetalleEventoSalud(evento.detalle);
  const vencido = detalle.proxima_fecha && new Date(detalle.proxima_fecha) < new Date();

  return (
    <div className="flex flex-col rounded-[17px] bg-portal-surface-low p-4 text-left">
      <span
        className={`mb-2 self-start rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
          vencido ? "bg-red-100 text-portal-error" : "bg-portal-teal-light/40 text-portal-teal"
        }`}
      >
        {vencido ? "Vencido" : TIPOS_LABEL[evento.tipo] ?? titulo}
      </span>
      <p className="text-sm font-bold text-portal-navy">{evento.titulo}</p>
      <p className="text-xs text-portal-muted">
        {vencido ? "Vencido" : "Aplicada"}: {formatFecha(evento.fecha)}
      </p>
    </div>
  );
}

function InfoTile({ etiqueta, valor, icono }: { etiqueta: string; valor: string; icono: string }) {
  return (
    <div className="rounded-[17px] bg-portal-surface-low p-3">
      <span className="material-symbols-rounded text-[18px] text-portal-orange">{icono}</span>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-portal-muted">{etiqueta}</p>
      <p className="truncate text-sm font-bold text-portal-navy">{valor}</p>
    </div>
  );
}
