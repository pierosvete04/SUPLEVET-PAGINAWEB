"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Check, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { acreditarPuntos, type SuplepuntosCliente, type SuplepuntosConfig } from "@/lib/data/portal/puntos";
import { formatFecha } from "@/lib/portal/formato";
import { NOMBRE_NIVEL, SIGUIENTE_NIVEL, UMBRAL_NIVEL } from "@/lib/data/portal/logros";
import { gsap } from "@/lib/gsap";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrandedLoader } from "@/components/ui/branded-loader";

interface CanjeConNombre {
  id: string;
  codigo_canje: string | null;
  estado: string;
  puntos_usados: number;
  created_at: string;
  suplepuntos_config: { nombre: string } | null;
}

const ESTADO_LABEL: Record<string, { texto: string; clase: string }> = {
  pendiente: { texto: "Listo para usar", clase: "bg-portal-teal-mid/15 text-portal-teal" },
  aplicado: { texto: "Ya usado", clase: "bg-portal-surface-variant text-portal-muted" },
  vencido: { texto: "Vencido", clase: "bg-portal-orange/15 text-portal-orange" },
  cancelado: { texto: "Cancelado", clase: "bg-portal-orange/15 text-portal-orange" },
};

interface Transaccion {
  id: string;
  accion: string;
  descripcion: string | null;
  puntos: number;
  created_at: string;
}

const ICONOS_CANJE: Record<string, string> = {
  canje_descuento_5: "💰",
  canje_descuento_10: "💸",
  canje_descuento_20: "🤑",
  canje_descuento_30: "💎",
  canje_envio_lima: "🚚",
  canje_envio_costa_sierra: "🚛",
  canje_envio_selva: "✈️",
  canje_muestra: "🎁",
  canje_bolsa_150: "🛍️",
  canje_bolsa_250: "🛒",
};

const ICONOS_HISTORIAL: Record<string, string> = {
  compra: "shopping_cart_checkout",
  pedido: "shopping_cart_checkout",
  canje: "redeem",
  acreditacion: "star",
  referido: "person_add",
};

const NIVELES_CAMINO = [
  { clave: "basico", nombre: "Básico", desc: "Acceso completo", icono: "lock_open" },
  { clave: "silver", nombre: "Silver", desc: "5% dcto adicional", icono: "workspace_premium" },
  { clave: "gold", nombre: "Gold", desc: "Envíos prioritarios", icono: "workspace_premium" },
  { clave: "diamond", nombre: "Diamond", desc: "Beneficios VIP", icono: "diamond" },
] as const;

const CIRCUNFERENCIA_ANILLO = 2 * Math.PI * 80;

interface PuntosDashboardProps {
  user: User;
}

const COLORES_GANAR = [
  "from-portal-orange to-red-500",
  "from-portal-teal-mid to-teal-700",
  "from-indigo-400 to-indigo-600",
  "from-yellow-300 to-yellow-500",
  "from-pink-300 to-pink-500",
  "from-blue-300 to-blue-500",
];

const EMOJIS_ACCION: Record<string, string> = {
  primera_compra: "🛒",
  mascota_1: "🐾",
  mascota_2_3: "🐾",
  referido: "👥",
  resena: "⭐",
  cumpleanos_mascota: "🎂",
  perfil_completo: "👤",
  encuesta: "📝",
  aniversario_cliente: "🎉",
  milestone_6_compras: "🏆",
};

export function PuntosDashboard({ user }: PuntosDashboardProps) {
  const [puntos, setPuntos] = useState<SuplepuntosCliente | null>(null);
  const [canjes, setCanjes] = useState<SuplepuntosConfig[]>([]);
  const [formasGanar, setFormasGanar] = useState<SuplepuntosConfig[]>([]);
  const [historial, setHistorial] = useState<Transaccion[]>([]);
  const [canjeSeleccionado, setCanjeSeleccionado] = useState<SuplepuntosConfig | null>(null);
  const [canjeConfirmado, setCanjeConfirmado] = useState<CanjeConNombre | null>(null);
  const [misCodigos, setMisCodigos] = useState<CanjeConNombre[]>([]);
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const [codigoListaCopiado, setCodigoListaCopiado] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    const supabase = createClient();
    const [{ data: pts }, { data: cfg }, { data: ganar }, { data: hist }, { data: codigos }] =
      await Promise.all([
        supabase.from("suplepuntos_clientes").select("*").eq("cliente_id", user.id).maybeSingle(),
        supabase
          .from("suplepuntos_config")
          .select("*")
          .eq("activo", true)
          .in("tipo", ["canje_descuento", "canje_envio", "canje_producto"])
          .order("puntos_requeridos", { ascending: true }),
        supabase
          .from("suplepuntos_config")
          .select("*")
          .eq("activo", true)
          .eq("tipo", "accion")
          .order("puntos_otorgados", { ascending: false }),
        supabase
          .from("suplepuntos_transacciones")
          .select("id, accion, descripcion, puntos, created_at")
          .eq("cliente_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("canjes")
          .select("id, codigo_canje, estado, puntos_usados, created_at, suplepuntos_config(nombre)")
          .eq("cliente_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
    setPuntos(pts);
    setCanjes(cfg ?? []);
    setFormasGanar(ganar ?? []);
    setHistorial(hist ?? []);
    setMisCodigos((codigos as unknown as CanjeConNombre[]) ?? []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  useEffect(() => {
    if (!puntos) return;
    const contador = { v: 0 };
    gsap.to(contador, {
      v: puntos.saldo_actual,
      duration: 1.4,
      ease: "power2.out",
      onUpdate: () => {
        const el = document.getElementById("pts-display");
        if (el) el.textContent = Math.round(contador.v).toLocaleString();
      },
    });
  }, [puntos]);

  async function confirmarCanje() {
    if (!canjeSeleccionado || !puntos) return;
    setProcesando(true);
    const supabase = createClient();
    const { data: nuevoCanje, error } = await supabase
      .from("canjes")
      .insert({
        cliente_id: user.id,
        config_id: canjeSeleccionado.id,
        puntos_usados: canjeSeleccionado.puntos_requeridos,
        estado: "pendiente",
      })
      .select("id, codigo_canje, estado, puntos_usados, created_at, suplepuntos_config(nombre)")
      .single();
    if (!error) {
      await acreditarPuntos(
        supabase,
        user.id,
        "canje",
        -(canjeSeleccionado.puntos_requeridos ?? 0),
        `Canje: ${canjeSeleccionado.nombre}`
      );
      setCanjeSeleccionado(null);
      setCanjeConfirmado((nuevoCanje as unknown as CanjeConNombre) ?? null);
      setCodigoCopiado(false);
      await cargar();
    }
    setProcesando(false);
  }

  async function copiarCodigoDeLista(id: string, codigo: string) {
    await navigator.clipboard.writeText(codigo);
    setCodigoListaCopiado(id);
    setTimeout(() => setCodigoListaCopiado((actual) => (actual === id ? null : actual)), 1500);
  }

  if (cargando || !puntos) {
    return <BrandedLoader />;
  }

  const nivel = puntos.nivel;
  const siguienteNivel = SIGUIENTE_NIVEL[nivel];
  const historicos = puntos.puntos_historicos;
  const progreso = siguienteNivel
    ? Math.min(100, ((historicos - UMBRAL_NIVEL[nivel]) / (UMBRAL_NIVEL[siguienteNivel] - UMBRAL_NIVEL[nivel])) * 100)
    : 100;
  const indiceNivelActual = NIVELES_CAMINO.findIndex((n) => n.clave === nivel);
  const dashOffset = CIRCUNFERENCIA_ANILLO - (progreso / 100) * CIRCUNFERENCIA_ANILLO;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-portal-navy">SuplePoints</h1>
        <p className="text-base text-portal-muted">Tu balance, niveles y catálogo de canjes.</p>
      </div>

      {/* Hero + Niveles */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="relative flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-2xl portal-glass-dark p-8 shadow-xl lg:col-span-3">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-portal-teal-mid opacity-30 mix-blend-screen blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-portal-teal-mid opacity-30 mix-blend-screen blur-3xl" />
          <div className="relative z-10 mb-6 h-48 w-48">
            <svg className="absolute inset-0 drop-shadow-lg" height="192" viewBox="0 0 192 192" width="192">
              <circle cx="96" cy="96" fill="none" r="80" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
              <circle
                className="transition-all duration-1000 ease-out"
                cx="96"
                cy="96"
                fill="none"
                r="80"
                stroke="url(#gPts)"
                strokeDasharray={CIRCUNFERENCIA_ANILLO}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                strokeWidth="12"
                transform="rotate(-90 96 96)"
              />
              <defs>
                <linearGradient id="gPts" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor="#5BBAC3" />
                  <stop offset="1" stopColor="#FD9755" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-white/70">Balance</div>
              <div id="pts-display" className="font-display text-5xl tracking-wide drop-shadow-md">
                0
              </div>
              <div className="mt-1 text-xs text-white/60">SuplePoints</div>
            </div>
          </div>
          <div className="z-10 w-full max-w-sm rounded-xl portal-glass p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-white">
                <span className="h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                {NOMBRE_NIVEL[nivel]}
              </span>
              <span className="text-xs text-white/60">{siguienteNivel ? NOMBRE_NIVEL[siguienteNivel] : "Máximo"}</span>
            </div>
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-portal-teal-mid shadow-[0_0_10px_rgba(91,186,195,0.5)] transition-all duration-700"
                style={{ width: `${progreso}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>
                {siguienteNivel
                  ? `${(UMBRAL_NIVEL[siguienteNivel] - historicos).toLocaleString()} pts para ${NOMBRE_NIVEL[siguienteNivel]}`
                  : "¡Nivel máximo!"}
              </span>
              <span>
                {historicos.toLocaleString()} / {siguienteNivel ? UMBRAL_NIVEL[siguienteNivel].toLocaleString() : "—"} pts
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-2xl portal-glass-card p-6 lg:col-span-2">
          <div className="mb-6 flex items-center gap-2 font-display text-xl tracking-wide text-portal-navy">
            <span className="material-symbols-rounded text-portal-orange">route</span> Tu Camino
          </div>
          <div className="relative space-y-4 before:absolute before:inset-y-4 before:left-6 before:w-0.5 before:bg-portal-surface-variant">
            {NIVELES_CAMINO.map((n, i) => {
              const esActual = i === indiceNivelActual;
              const bloqueado = i > indiceNivelActual;
              return (
                <div
                  key={n.clave}
                  className={`group relative z-10 flex items-start gap-4 ${bloqueado ? "opacity-50 grayscale transition-all duration-300 hover:grayscale-0" : ""}`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 shadow-sm transition-transform group-hover:scale-110 ${
                      i === 0
                        ? "border-portal-surface-variant bg-portal-surface-low"
                        : `portal-level-${n.clave}`
                    } ${esActual ? "shadow-md ring-4 ring-yellow-400/20" : ""}`}
                  >
                    <span className="material-symbols-rounded text-xl text-portal-navy/70">{n.icono}</span>
                  </div>
                  <div className="pt-1">
                    <div className="flex items-center gap-2 font-bold text-portal-navy">
                      {n.nombre}
                      {esActual && (
                        <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-yellow-800">
                          Actual
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-portal-muted">
                      {UMBRAL_NIVEL[n.clave]} pts · {n.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cómo ganar */}
      <div className="mb-10">
        <h3 className="mb-4 flex items-center gap-2 font-display text-2xl tracking-wide text-portal-navy">
          <span className="material-symbols-rounded text-portal-orange">add_circle</span> Cómo ganar más puntos
        </h3>
        {formasGanar.length === 0 ? (
          <p className="rounded-xl portal-glass-card p-6 text-center text-sm text-portal-muted">
            Aún no hay formas de ganar puntos configuradas.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {formasGanar.map((f, i) => (
              <div
                key={f.id}
                title={f.descripcion ?? undefined}
                className="flex cursor-default flex-col items-center rounded-xl portal-glass-card border-b-4 border-b-transparent p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:border-b-portal-orange hover:shadow-lg"
              >
                <div
                  className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-2xl text-white shadow-md ${COLORES_GANAR[i % COLORES_GANAR.length]}`}
                >
                  {EMOJIS_ACCION[f.clave] ?? "⭐"}
                </div>
                <div className="mb-1 text-sm font-bold leading-tight text-portal-navy">{f.nombre}</div>
                <div className="text-xs text-portal-muted">
                  {f.puntos_otorgados != null ? `+${f.puntos_otorgados} pts` : "Variable"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Catálogo de canjes */}
      <div className="mb-10">
        <div className="mb-4 flex items-end justify-between">
          <h3 className="flex items-center gap-2 font-display text-2xl tracking-wide text-portal-navy">
            <span className="material-symbols-rounded text-portal-orange">redeem</span> Catálogo de Recompensas
          </h3>
          <span className="text-sm font-medium text-portal-muted">
            Tu saldo: <strong className="text-lg text-portal-orange">{puntos.saldo_actual.toLocaleString()} pts</strong>
          </span>
        </div>
        {canjes.length === 0 ? (
          <p className="rounded-xl portal-glass-card p-6 text-center text-sm text-portal-muted">
            Sin canjes disponibles por ahora
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {canjes.map((c) => {
              const puede = puntos.saldo_actual >= (c.puntos_requeridos ?? 0);
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={!puede}
                  onClick={() => setCanjeSeleccionado(c)}
                  className={`group flex flex-col overflow-hidden rounded-xl portal-glass-card text-left transition-all duration-300 ${puede ? "cursor-pointer hover:shadow-lg" : "opacity-60"}`}
                >
                  <div className="relative flex h-32 items-center justify-center overflow-hidden bg-portal-surface-variant">
                    <span
                      className={`text-4xl drop-shadow-sm transition-transform duration-300 ${puede ? "group-hover:scale-110" : "grayscale"}`}
                    >
                      {ICONOS_CANJE[c.clave] ?? "🎁"}
                    </span>
                    {!puede && (
                      <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white">
                        <span className="material-symbols-rounded text-xs text-portal-muted">lock</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h4 className="mb-1 text-sm font-bold leading-tight text-portal-navy transition-colors group-hover:text-portal-orange">
                      {c.nombre}
                    </h4>
                    {c.descripcion && (
                      <p className="mb-3 flex-1 text-xs text-portal-muted line-clamp-2">{c.descripcion}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between">
                      <span className={`font-display text-xl tracking-wide ${puede ? "text-portal-orange" : "text-portal-muted"}`}>
                        {c.puntos_requeridos} PTS
                      </span>
                      {puede ? (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-portal-orange/10 text-portal-orange">
                          <span className="material-symbols-rounded text-sm">shopping_cart</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-portal-muted">
                          Te faltan {(c.puntos_requeridos ?? 0) - puntos.saldo_actual}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tus códigos de descuento (canjes) */}
      <div className="mb-10 overflow-hidden rounded-2xl portal-glass-card">
        <div className="flex items-center gap-2 border-b border-portal-surface-variant/50 bg-portal-surface-low/50 p-5">
          <span className="material-symbols-rounded text-portal-orange">confirmation_number</span>
          <h3 className="font-display text-xl tracking-wide text-portal-navy">Tus códigos de descuento</h3>
        </div>
        {misCodigos.length === 0 ? (
          <p className="p-6 text-center text-xs text-portal-muted">
            Aún no has canjeado ninguna recompensa.
          </p>
        ) : (
          <div className="divide-y divide-portal-surface-variant/30">
            {misCodigos.map((c) => {
              const estado = ESTADO_LABEL[c.estado] ?? ESTADO_LABEL.pendiente;
              const copiado = codigoListaCopiado === c.id;
              return (
                <div key={c.id} className="flex flex-nowrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0 shrink truncate">
                    <div className="truncate text-sm font-bold text-portal-navy">
                      {c.suplepuntos_config?.nombre ?? "Canje"}
                    </div>
                    <div className="text-xs text-portal-muted">{formatFecha(c.created_at)}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {c.codigo_canje && (
                      <button
                        type="button"
                        onClick={() => copiarCodigoDeLista(c.id, c.codigo_canje!)}
                        title="Copiar código"
                        className="flex items-center gap-1.5 rounded-md bg-portal-surface-low px-3 py-1.5 font-mono text-sm font-bold tracking-wide text-portal-navy transition-colors hover:bg-portal-surface-variant"
                      >
                        {c.codigo_canje}
                        {copiado ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-portal-teal-mid" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 shrink-0 text-portal-muted" />
                        )}
                      </button>
                    )}
                    <span className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-bold ${estado.clase}`}>
                      {estado.texto}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historial */}
      <div className="overflow-hidden rounded-2xl portal-glass-card">
        <div className="flex items-center gap-2 border-b border-portal-surface-variant/50 bg-portal-surface-low/50 p-5">
          <span className="material-symbols-rounded text-portal-orange">history</span>
          <h3 className="font-display text-xl tracking-wide text-portal-navy">Historial de Movimientos</h3>
        </div>
        {historial.length === 0 ? (
          <p className="p-6 text-center text-xs text-portal-muted">Sin movimientos aún</p>
        ) : (
          <div className="divide-y divide-portal-surface-variant/30">
            {historial.map((t) => {
              const positivo = t.puntos > 0;
              return (
                <div key={t.id} className="flex items-center p-4 transition-colors hover:bg-portal-surface-low/30">
                  <div
                    className={`mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      positivo ? "bg-portal-teal-mid/10 text-portal-teal" : "bg-portal-orange/10 text-portal-orange"
                    }`}
                  >
                    <span className="material-symbols-rounded text-lg">{ICONOS_HISTORIAL[t.accion] ?? "star"}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-portal-navy">{t.descripcion || t.accion}</div>
                    <div className="text-xs text-portal-muted">{formatFecha(t.created_at)}</div>
                  </div>
                  <div className={`font-display text-lg tracking-wide ${positivo ? "text-portal-teal" : "text-portal-orange"}`}>
                    {positivo ? "+" : ""}
                    {t.puntos} pts
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!canjeSeleccionado} onOpenChange={(o) => !o && setCanjeSeleccionado(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar canje</DialogTitle>
          </DialogHeader>
          {canjeSeleccionado && (
            <div className="flex flex-col gap-3 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-portal-orange/10 text-4xl">
                {ICONOS_CANJE[canjeSeleccionado.clave] ?? "🎁"}
              </div>
              <p className="font-display text-lg font-bold text-portal-navy">{canjeSeleccionado.nombre}</p>
              <p className="font-body text-sm text-portal-muted">
                Usarás {canjeSeleccionado.puntos_requeridos} pts de tu saldo de {puntos.saldo_actual} pts.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setCanjeSeleccionado(null)}>
                  Cancelar
                </Button>
                <Button className="flex-1" disabled={procesando} onClick={confirmarCanje}>
                  <span className="material-symbols-rounded text-[16px]">redeem</span>{" "}
                  {procesando ? "Procesando…" : "Confirmar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!canjeConfirmado} onOpenChange={(o) => !o && setCanjeConfirmado(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¡Canje confirmado!</DialogTitle>
          </DialogHeader>
          {canjeConfirmado && (
            <div className="flex flex-col gap-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-portal-teal-mid/10 text-4xl">
                🎉
              </div>
              <p className="font-body text-sm text-portal-muted">
                {canjeConfirmado.suplepuntos_config?.nombre} — usa este código en tu próxima compra en
                la página web.
              </p>
              <button
                type="button"
                onClick={async () => {
                  if (!canjeConfirmado.codigo_canje) return;
                  await navigator.clipboard.writeText(canjeConfirmado.codigo_canje);
                  setCodigoCopiado(true);
                }}
                className="mx-auto flex items-center gap-3 rounded-xl border-2 border-dashed border-portal-teal-mid bg-portal-teal-mid/5 px-6 py-4 transition-colors hover:bg-portal-teal-mid/10"
              >
                <code className="font-mono text-2xl font-bold tracking-widest text-portal-navy">
                  {canjeConfirmado.codigo_canje}
                </code>
                {codigoCopiado ? (
                  <Check className="h-5 w-5 shrink-0 text-portal-teal-mid" />
                ) : (
                  <Copy className="h-5 w-5 shrink-0 text-portal-muted" />
                )}
              </button>
              <p className="font-body text-xs text-portal-muted">
                {codigoCopiado
                  ? "¡Copiado! Pégalo en el campo de código de descuento al pagar."
                  : "Toca el código para copiarlo."}{" "}
                Es de un solo uso — no lo compartas.
              </p>
              <Button onClick={() => setCanjeConfirmado(null)}>Listo</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
