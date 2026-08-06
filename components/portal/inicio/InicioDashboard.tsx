"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { Cat, Dog, Gem } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calcularEdad, formatFecha } from "@/lib/portal/formato";
import type { ClientePerfil } from "@/lib/data/portal/cliente";
import type { SuplepuntosCliente } from "@/lib/data/portal/puntos";
import { crearNotificacion } from "@/lib/data/portal/notificaciones";
import { NOMBRE_NIVEL, SIGUIENTE_NIVEL, UMBRAL_NIVEL, type LogroConfig } from "@/lib/data/portal/logros";
import { TiendaSheet } from "@/components/portal/inicio/TiendaSheet";
import { PortalIcon } from "@/components/portal/icons/PortalIcon";

interface Mascota {
  id: string;
  nombre: string;
  especie: string;
  especie_otro: string | null;
  raza: string | null;
  foto_url: string | null;
  fecha_nacimiento: string | null;
  peso_kg: number | null;
}

const ESPECIE_LABEL: Record<string, string> = { perro: "Perro", gato: "Gato" };

interface Transaccion {
  id: string;
  accion: string;
  descripcion: string | null;
  puntos: number;
  created_at: string;
}

const ICONO_ACCION: Record<string, string> = {
  compra: "shopping_bag",
  pedido: "shopping_bag",
  canje: "redeem",
  acreditacion: "star",
  referido: "person_add",
};

interface InicioDashboardProps {
  user: User;
  perfil: ClientePerfil | null;
  puntosInicial: SuplepuntosCliente | null;
  mascotasIniciales: Mascota[];
  vacunaPendienteInicial: Record<string, boolean>;
  transaccionesIniciales: Transaccion[];
  logrosIniciales: LogroConfig[];
  logrosGanadosIniciales: string[];
}

// Recibe todo el contenido de la primera carga ya resuelto por el servidor
// (ver app/mi-cuenta/(portal)/page.tsx) — el único trabajo que queda en el
// cliente es la verificación de logros nuevos, porque esa sí escribe datos
// (inserta en cliente_logros) y no tiene sentido resolverla en cada render
// del servidor.
export function InicioDashboard({
  user,
  perfil,
  puntosInicial,
  mascotasIniciales,
  vacunaPendienteInicial,
  transaccionesIniciales,
  logrosIniciales,
  logrosGanadosIniciales,
}: InicioDashboardProps) {
  const puntos = puntosInicial;
  const mascotas = mascotasIniciales;
  const vacunaPendiente = vacunaPendienteInicial;
  const transacciones = transaccionesIniciales;
  const logros = logrosIniciales;
  const [logrosGanados, setLogrosGanados] = useState<Set<string>>(new Set(logrosGanadosIniciales));
  const [tiendaAbierta, setTiendaAbierta] = useState(false);

  useEffect(() => {
    if (!puntosInicial) return;
    const supabase = createClient();
    verificarLogrosNuevos(
      supabase,
      user,
      puntosInicial,
      perfil,
      logrosIniciales,
      new Set(logrosGanadosIniciales),
      setLogrosGanados
    );
    // Solo debe correr una vez al montar con los datos de la carga inicial —
    // no en cada cambio de referencia de user/perfil.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";
  const primerNombre = perfil?.nombre?.trim().split(/\s+/)[0] || user.email?.split("@")[0] || "";
  const nombre = primerNombre
    ? primerNombre.charAt(0).toLocaleUpperCase("es") + primerNombre.slice(1).toLocaleLowerCase("es")
    : "";

  const nivel = puntos?.nivel ?? "basico";
  const siguienteNivel = SIGUIENTE_NIVEL[nivel];
  const historicos = puntos?.puntos_historicos ?? 0;
  const progreso = siguienteNivel
    ? Math.min(100, ((historicos - UMBRAL_NIVEL[nivel]) / (UMBRAL_NIVEL[siguienteNivel] - UMBRAL_NIVEL[nivel])) * 100)
    : 100;

  return (
    <div id="section-inicio">
      {/* Greeting */}
      <div>
        <div className="mb-1 text-xs font-bold uppercase tracking-[0.1em] text-portal-muted">{saludo}</div>
        <h1 className="font-display text-4xl font-semibold leading-tight text-portal-navy md:text-5xl">
          Hola, <em className="not-italic text-portal-orange">{nombre || "—"}</em>
        </h1>
      </div>

      {/* Wallet & Overview */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Link href="/mi-cuenta/puntos" className="group cursor-pointer lg:col-span-2">
          <div className="portal-wallet-card flex h-full flex-col justify-between">
            <div className="portal-wallet-glow" />
            <div className="relative z-10 mb-8 flex items-start justify-between">
              <div>
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-portal-teal-light">
                  Tu Balance
                </div>
                <div className="flex items-baseline gap-2 font-display text-5xl font-semibold leading-none md:text-6xl">
                  {/* El saldo se pinta ya con su valor final: antes una
                      animación de conteo lo llevaba de 0 al total en cada
                      montaje, así que cualquier navegación de vuelta al inicio
                      (incluido el clic en una notificación) parecía un reseteo
                      del balance. */}
                  <span>{(puntos?.saldo_actual ?? 0).toLocaleString()}</span>
                  <span className="font-body text-lg font-medium text-white/60">SuplePoints</span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-transform group-hover:scale-110">
                <PortalIcon name="star" className="text-3xl text-portal-orange" />
              </div>
            </div>
            <div className="relative z-10">
              <div className="mb-2 flex justify-between text-xs font-medium text-white/80">
                <span>Nivel {NOMBRE_NIVEL[nivel]}</span>
                <span>{siguienteNivel ? `Nivel ${NOMBRE_NIVEL[siguienteNivel]}` : ""}</span>
              </div>
              <div className="portal-progress-track mb-2">
                <div className="portal-progress-fill" style={{ width: `${progreso}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-white/60">
                  {siguienteNivel ? (
                    `Faltan ${(UMBRAL_NIVEL[siguienteNivel] - historicos).toLocaleString()} pts para subir de nivel`
                  ) : (
                    <>
                      <Gem className="h-3.5 w-3.5" strokeWidth={2} /> ¡Nivel máximo!
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-portal-orange transition-transform group-hover:translate-x-1">
                  Ver recompensas <PortalIcon name="arrow_forward" className="text-[14px]" />
                </div>
              </div>
            </div>
          </div>
        </Link>

        <div className="flex flex-col items-center justify-center rounded-[18px] border border-portal-surface-variant bg-white p-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-portal-teal-light/20">
            <PortalIcon name="shopping_basket" className="text-3xl text-portal-teal-mid" />
          </div>
          <h3 className="mb-2 font-display text-lg font-semibold text-portal-navy">¿Necesitas suplevet?</h3>
          <p className="mb-4 text-sm text-portal-muted">Compra tu próxima bolsa de Suplevet y sigue sumando SuplePoints.</p>
          <button
            type="button"
            onClick={() => setTiendaAbierta(true)}
            className="w-full rounded-[17px] bg-portal-orange py-2.5 text-sm font-semibold text-white transition-colors hover:bg-portal-orange-dark"
          >
            Comprar ahora
          </button>
        </div>
      </div>

      <TiendaSheet open={tiendaAbierta} onOpenChange={setTiendaAbierta} />

      {/* Pets */}
      <div className="mt-6">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold text-portal-navy">Mis Mascotas</h2>
          <Link
            href="/mi-cuenta/mascotas"
            className="flex items-center gap-1 text-sm font-semibold text-portal-orange hover:text-portal-orange-dark"
          >
            Ver todas <PortalIcon name="arrow_forward" className="text-[18px]" />
          </Link>
        </div>
        {mascotas.length === 0 ? (
          <Link
            href="/mi-cuenta/mascotas"
            className="portal-pet-card flex min-h-[180px] cursor-pointer items-center justify-center gap-2 text-sm text-portal-muted"
          >
            <PortalIcon name="pets" />
            Registra tu primera mascota →
          </Link>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mascotas.map((m) => {
              const edad = m.fecha_nacimiento ? calcularEdad(m.fecha_nacimiento) : null;
              const especieLabel = ESPECIE_LABEL[m.especie] ?? m.especie_otro ?? "Mascota";
              const pendiente = vacunaPendiente[m.id];
              return (
                <Link
                  key={m.id}
                  href="/mi-cuenta/mascotas"
                  className="portal-pet-card group flex cursor-pointer overflow-hidden !p-0 text-left"
                >
                  <div className="relative w-[42%] shrink-0 bg-portal-surface-low">
                    {m.foto_url ? (
                      <Image src={m.foto_url} alt={m.nombre} fill className="object-cover" sizes="220px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-portal-muted">
                        {m.especie === "gato" ? (
                          <Cat className="h-10 w-10" strokeWidth={1.5} />
                        ) : (
                          <Dog className="h-10 w-10" strokeWidth={1.5} />
                        )}
                      </div>
                    )}
                    {pendiente && (
                      <div
                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-portal-error shadow-sm"
                        title="Vacuna pendiente"
                      >
                        <PortalIcon name="vaccines" className="text-[12px] text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5">
                    <h4 className="font-display text-2xl font-semibold leading-tight text-portal-navy">{m.nombre}</h4>
                    <p className="text-sm text-portal-muted">{especieLabel}</p>
                    {edad && <p className="text-sm text-portal-muted">Edad: {edad}</p>}
                    {m.peso_kg != null && <p className="text-sm text-portal-muted">Peso: {m.peso_kg} kg</p>}
                    <div className="mt-3">
                      {pendiente ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-portal-surface-low px-4 py-1.5 text-xs font-semibold text-portal-navy">
                          <PortalIcon name="warning" className="text-[16px] text-portal-error" />
                          Vacuna pendiente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-portal-teal-light/25 px-4 py-1.5 text-xs font-semibold text-portal-teal-mid">
                          <PortalIcon name="check_circle" className="text-[16px]" />
                          Al día
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Achievements & Activity */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* id + scroll-mt: destino del enlace de las notificaciones de logro
            ("/mi-cuenta#logros"), que es el único lugar donde se muestran. */}
        <div id="logros" className="scroll-mt-6 rounded-[18px] border border-portal-surface-variant bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-portal-navy">Logros Recientes</h2>
            <span className="rounded-full bg-portal-surface-low px-3 py-1 text-sm font-medium text-portal-muted">
              {logrosGanados.size}/{logros.length}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {logros.slice(0, 4).map((l) => {
              const ganado = logrosGanados.has(l.clave);
              return (
                <div
                  key={l.id}
                  title={`${l.nombre}${ganado ? "" : " — bloqueado"}`}
                  className={`portal-achievement-badge ${ganado ? "unlocked" : ""}`}
                >
                  <PortalIcon name={l.icon || "military_tech"} className={`mb-1 text-3xl ${ganado ? "text-portal-orange" : "text-portal-muted/40"}`} />
                  <span
                    className={`text-center text-[10px] font-bold leading-tight ${ganado ? "text-portal-navy" : "text-portal-muted/60"}`}
                  >
                    {l.nombre}
                  </span>
                </div>
              );
            })}
          </div>
          <Link
            href="/mi-cuenta/puntos"
            className="mt-6 block w-full rounded-xl border border-portal-surface-variant py-2 text-center text-sm font-semibold text-portal-navy transition-colors hover:bg-portal-surface-low"
          >
            Ver todos los logros
          </Link>
        </div>

        <div className="rounded-[18px] border border-portal-surface-variant bg-white p-6">
          <h2 className="mb-6 font-display text-xl font-semibold text-portal-navy">Actividad</h2>
          {transacciones.length === 0 ? (
            <p className="text-center text-xs text-portal-muted">Sin actividad reciente</p>
          ) : (
            <div className="space-y-1">
              {transacciones.map((t) => {
                const positivo = t.puntos > 0;
                return (
                  <div key={t.id} className="portal-timeline-item">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-portal-teal-light/30">
                      <PortalIcon name={ICONO_ACCION[t.accion] ?? "star"} className="text-portal-teal" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-portal-navy">{t.descripcion || t.accion}</p>
                      <p className="text-xs text-portal-muted">
                        {positivo ? "+" : ""}
                        {t.puntos} pts
                      </p>
                    </div>
                    <div className="ml-auto text-xs text-portal-muted">{formatFecha(t.created_at)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Verifica y acredita logros que ya se cumplieron pero no están registrados —
// replica loadLogros() del portal viejo (assets/js/inicio.js).
// Evalúa cada logro activo según su condicion_tipo/condicion_valor (configurables
// desde /admin/logros) en vez de claves hardcodeadas — así un logro nuevo creado
// en el admin con un condicion_tipo existente se desbloquea automáticamente.
async function verificarLogrosNuevos(
  supabase: ReturnType<typeof createClient>,
  user: User,
  puntos: SuplepuntosCliente,
  perfil: ClientePerfil | null,
  logros: LogroConfig[],
  ganados: Set<string>,
  setGanados: (s: Set<string>) => void
) {
  const [{ data: mascotas }, { data: pedidos }, { count: referidosCount }] = await Promise.all([
    supabase.from("mascotas").select("id").eq("cliente_id", user.id),
    supabase.from("pedidos").select("id").eq("cliente_id", user.id),
    supabase.from("referidos").select("id", { count: "exact", head: true }).eq("cliente_referidor_id", user.id),
  ]);
  const mesesActivo = user.created_at
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (30 * 24 * 3600 * 1000))
    : 0;

  const valoresPorCondicion: Record<string, number> = {
    mascota_count: mascotas?.length ?? 0,
    compras_count: pedidos?.length ?? 0,
    meses_activo: mesesActivo,
    perfil_completo: perfil?.perfil_completo ? 1 : 0,
    nivel_silver: ["silver", "gold", "diamond"].includes(puntos.nivel) ? 1 : 0,
    nivel_gold: ["gold", "diamond"].includes(puntos.nivel) ? 1 : 0,
    nivel_diamond: puntos.nivel === "diamond" ? 1 : 0,
    referido: referidosCount ?? 0,
  };

  const nuevos = new Set(ganados);
  for (const logro of logros) {
    if (nuevos.has(logro.clave) || !logro.condicion_tipo) continue;
    const valorActual = valoresPorCondicion[logro.condicion_tipo];
    const cumplido = valorActual !== undefined && valorActual >= (logro.condicion_valor ?? 1);
    if (cumplido) {
      const { error } = await supabase
        .from("cliente_logros")
        .insert({ cliente_id: user.id, logro_clave: logro.clave });
      if (!error) {
        nuevos.add(logro.clave);
        await crearNotificacion(
          supabase,
          user.id,
          "logro",
          "¡Nuevo logro desbloqueado!",
          logro.nombre,
          "/mi-cuenta#logros"
        );
      }
    }
  }
  if (nuevos.size !== ganados.size) setGanados(nuevos);
}
