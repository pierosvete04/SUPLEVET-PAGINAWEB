"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { gsap } from "@/lib/gsap";
import { formatFecha } from "@/lib/portal/formato";
import type { ClientePerfil } from "@/lib/data/portal/cliente";
import type { SuplepuntosCliente } from "@/lib/data/portal/puntos";
import type { DetalleEventoSalud } from "@/lib/data/portal/mascotas";
import { NOMBRE_NIVEL, SIGUIENTE_NIVEL, UMBRAL_NIVEL, type LogroConfig } from "@/lib/data/portal/logros";
import { TiendaSheet } from "@/components/portal/inicio/TiendaSheet";

interface Mascota {
  id: string;
  nombre: string;
  especie: string;
  raza: string | null;
  foto_url: string | null;
}

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
}

export function InicioDashboard({ user, perfil }: InicioDashboardProps) {
  const [puntos, setPuntos] = useState<SuplepuntosCliente | null>(null);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [vacunaPendiente, setVacunaPendiente] = useState<Record<string, boolean>>({});
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [logros, setLogros] = useState<LogroConfig[]>([]);
  const [logrosGanados, setLogrosGanados] = useState<Set<string>>(new Set());
  const [cargando, setCargando] = useState(true);
  const [tiendaAbierta, setTiendaAbierta] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function cargar() {
      const [{ data: pts }, { data: masc }, { data: tx }, { data: logrosCfg }, { data: ganados }] =
        await Promise.all([
          supabase.from("suplepuntos_clientes").select("*").eq("cliente_id", user.id).maybeSingle(),
          supabase
            .from("mascotas")
            .select("id, nombre, especie, raza, foto_url")
            .eq("cliente_id", user.id)
            .order("created_at", { ascending: true })
            .limit(3),
          supabase
            .from("suplepuntos_transacciones")
            .select("id, accion, descripcion, puntos, created_at")
            .eq("cliente_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase.from("logros_config").select("*").eq("activo", true).order("orden", { ascending: true }),
          supabase.from("cliente_logros").select("logro_clave").eq("cliente_id", user.id),
        ]);

      setPuntos(pts);
      setMascotas(masc ?? []);
      setTransacciones(tx ?? []);
      setLogros(logrosCfg ?? []);
      const ganadosSet = new Set((ganados ?? []).map((g) => g.logro_clave));
      setLogrosGanados(ganadosSet);
      setCargando(false);

      if (masc && masc.length > 0) {
        const { data: eventos } = await supabase
          .from("mascota_eventos")
          .select("mascota_id, detalle")
          .in(
            "mascota_id",
            masc.map((m) => m.id)
          )
          .eq("tipo", "vacuna")
          .order("fecha", { ascending: false });
        const pendientePorMascota: Record<string, boolean> = {};
        for (const ev of eventos ?? []) {
          if (pendientePorMascota[ev.mascota_id] !== undefined) continue;
          let detalle: DetalleEventoSalud = {};
          try {
            detalle = ev.detalle ? JSON.parse(ev.detalle) : {};
          } catch {
            detalle = {};
          }
          pendientePorMascota[ev.mascota_id] = !!(
            detalle.proxima_fecha && new Date(detalle.proxima_fecha) < new Date()
          );
        }
        setVacunaPendiente(pendientePorMascota);
      }

      if (pts) await verificarLogrosNuevos(supabase, user, pts, perfil, logrosCfg ?? [], ganadosSet, setLogrosGanados);
    }

    cargar();
  }, [user, perfil]);

  useEffect(() => {
    if (!puntos) return;
    const contador = { v: 0 };
    gsap.to(contador, {
      v: puntos.saldo_actual,
      duration: 1.4,
      ease: "power2.out",
      onUpdate: () => {
        const el = document.getElementById("inicio-pts");
        if (el) el.textContent = Math.round(contador.v).toLocaleString();
      },
    });
  }, [puntos]);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";
  const nombre =
    [perfil?.nombre, perfil?.apellido].filter(Boolean).join(" ") || user.email?.split("@")[0] || "";

  const nivel = puntos?.nivel ?? "basico";
  const siguienteNivel = SIGUIENTE_NIVEL[nivel];
  const historicos = puntos?.puntos_historicos ?? 0;
  const progreso = siguienteNivel
    ? Math.min(100, ((historicos - UMBRAL_NIVEL[nivel]) / (UMBRAL_NIVEL[siguienteNivel] - UMBRAL_NIVEL[nivel])) * 100)
    : 100;

  if (cargando) {
    return <p className="font-body text-sm text-portal-muted">Cargando…</p>;
  }

  return (
    <div id="section-inicio">
      {/* Greeting */}
      <div>
        <div className="mb-1 text-xs font-bold uppercase tracking-[0.1em] text-portal-muted">{saludo} 👋</div>
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
                  <span id="inicio-pts">0</span>
                  <span className="font-body text-lg font-medium text-white/60">SuplePoints</span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-transform group-hover:scale-110">
                <span className="material-symbols-rounded text-3xl text-portal-orange">star</span>
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
                <div className="text-xs text-white/60">
                  {siguienteNivel
                    ? `Faltan ${(UMBRAL_NIVEL[siguienteNivel] - historicos).toLocaleString()} pts para subir de nivel`
                    : "¡Nivel máximo! 💎"}
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-portal-orange transition-transform group-hover:translate-x-1">
                  Ver recompensas <span className="material-symbols-rounded text-[14px]">arrow_forward</span>
                </div>
              </div>
            </div>
          </div>
        </Link>

        <div className="flex flex-col items-center justify-center rounded-[24px] border border-portal-surface-variant bg-white p-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-portal-teal-light/20">
            <span className="material-symbols-rounded text-3xl text-portal-teal-mid">shopping_basket</span>
          </div>
          <h3 className="mb-2 font-display text-lg font-semibold text-portal-navy">¿Necesitas suplevet?</h3>
          <p className="mb-4 text-sm text-portal-muted">Gana el doble de puntos en tu próxima compra de alimento.</p>
          <button
            type="button"
            onClick={() => setTiendaAbierta(true)}
            className="w-full rounded-[17px] bg-portal-navy-dark py-2.5 text-sm font-semibold text-white transition-colors hover:bg-portal-navy"
          >
            Comprar ahora
          </button>
        </div>
      </div>

      <TiendaSheet open={tiendaAbierta} onOpenChange={setTiendaAbierta} />

      {/* Pets */}
      <div className="mt-10">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold text-portal-navy">Mis Mascotas</h2>
          <Link
            href="/mi-cuenta/mascotas"
            className="flex items-center gap-1 text-sm font-semibold text-portal-orange hover:text-portal-orange-dark"
          >
            Ver todas <span className="material-symbols-rounded text-[18px]">arrow_forward</span>
          </Link>
        </div>
        {mascotas.length === 0 ? (
          <Link
            href="/mi-cuenta/mascotas"
            className="portal-pet-card flex min-h-[180px] cursor-pointer items-center justify-center gap-2 text-sm text-portal-muted"
          >
            <span className="material-symbols-rounded">pets</span>
            Registra tu primera mascota →
          </Link>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {mascotas.map((m) => {
              const pendiente = vacunaPendiente[m.id];
              return (
                <Link
                  key={m.id}
                  href="/mi-cuenta/mascotas"
                  className="portal-pet-card flex cursor-pointer flex-col items-center text-center"
                >
                  <div className="portal-pet-avatar-lg mb-4">
                    {m.foto_url ? (
                      <Image src={m.foto_url} alt={m.nombre} fill className="rounded-full object-cover" sizes="80px" />
                    ) : (
                      <span>{m.especie === "gato" ? "🐱" : "🐶"}</span>
                    )}
                    {pendiente && (
                      <div className="portal-health-indicator" title="Vacuna pendiente">
                        <span className="material-symbols-rounded text-[12px] text-white">vaccines</span>
                      </div>
                    )}
                  </div>
                  <h4 className="mb-1 font-display text-lg font-semibold text-portal-navy">{m.nombre}</h4>
                  <p className="mb-3 text-xs text-portal-muted">
                    {[m.raza, m.especie].filter(Boolean).join(" • ")}
                  </p>
                  {pendiente ? (
                    <div className="flex w-full items-center justify-center gap-1 rounded-lg bg-portal-surface-low py-1.5 text-xs font-semibold text-portal-navy">
                      <span className="material-symbols-rounded text-[14px] text-portal-error">warning</span>
                      Vacuna pendiente
                    </div>
                  ) : (
                    <div className="flex w-full items-center justify-center gap-1 rounded-lg bg-portal-teal-light/20 py-1.5 text-xs font-semibold text-portal-teal-mid">
                      <span className="material-symbols-rounded text-[14px]">check_circle</span>
                      Al día
                    </div>
                  )}
                </Link>
              );
            })}
            <Link
              href="/mi-cuenta/mascotas"
              className="portal-pet-card flex min-h-[200px] cursor-pointer flex-col items-center justify-center border-2 border-dashed border-portal-surface-variant bg-transparent hover:bg-portal-surface-low"
            >
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-portal-surface-variant">
                <span className="material-symbols-rounded text-2xl text-portal-muted">add</span>
              </div>
              <span className="text-sm font-semibold text-portal-navy">Añadir mascota</span>
            </Link>
          </div>
        )}
      </div>

      {/* Achievements & Activity */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-[24px] border border-portal-surface-variant bg-white p-6">
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
                  <span
                    className={`material-symbols-rounded mb-1 text-3xl ${ganado ? "text-portal-orange" : "text-portal-muted/40"}`}
                  >
                    {l.icon || "military_tech"}
                  </span>
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

        <div className="rounded-[24px] border border-portal-surface-variant bg-white p-6">
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
                      <span className="material-symbols-rounded text-portal-teal">
                        {ICONO_ACCION[t.accion] ?? "star"}
                      </span>
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
      if (!error) nuevos.add(logro.clave);
    }
  }
  if (nuevos.size !== ganados.size) setGanados(nuevos);
}
