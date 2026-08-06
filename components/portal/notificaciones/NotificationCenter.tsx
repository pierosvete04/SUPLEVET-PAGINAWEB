"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  contarNoLeidas,
  listarNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
  type Notificacion,
} from "@/lib/data/portal/notificaciones";
import { formatFechaRelativa } from "@/lib/portal/formato";
import { PortalIcon } from "@/components/portal/icons/PortalIcon";

interface NotificationCenterProps {
  userId: string;
  noLeidasIniciales: number;
}

// Campanita flotante + panel de historial + puente de Supabase Realtime que
// dispara el toast bottom-right cuando llega una notificación nueva. Se
// combinan en un solo componente (en vez de separar "bridge" y "bell") porque
// ambos necesitan el mismo canal realtime y el mismo contador de no leídas.
export function NotificationCenter({ userId, noLeidasIniciales }: NotificationCenterProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [noLeidas, setNoLeidas] = useState(noLeidasIniciales);
  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel(`notificaciones:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notificaciones", filter: `cliente_id=eq.${userId}` },
        ({ new: fila }: { new: Notificacion }) => {
          toast(fila.titulo, {
            description: fila.mensaje,
            icon: <PortalIcon name={fila.icon} className="text-[20px]" />,
          });
          setNoLeidas((n) => n + 1);
          setNotificaciones((prev) => (prev ? [fila, ...prev] : prev));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [userId]);

  useEffect(() => {
    if (!abierto) return;
    function onClickFuera(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, [abierto]);

  async function abrirPanel() {
    setAbierto((v) => !v);
    if (notificaciones === null) {
      setCargando(true);
      const supabase = createClient();
      const lista = await listarNotificaciones(supabase, userId);
      setNotificaciones(lista);
      setCargando(false);
    }
  }

  async function handleClickNotificacion(n: Notificacion) {
    setAbierto(false);
    if (!n.leido) {
      const supabase = createClient();
      await marcarLeida(supabase, n.id);
      setNotificaciones((prev) => prev?.map((x) => (x.id === n.id ? { ...x, leido: true } : x)) ?? prev);
      setNoLeidas((v) => Math.max(0, v - 1));
    }
    if (!n.link) return;

    // Si la notificación apunta a la página en la que ya estamos, navegar sería
    // un re-render inútil (y visualmente parece que la pantalla "se reinicia").
    // En ese caso solo se lleva al usuario a la sección correspondiente.
    const [ruta, ancla] = n.link.split("#");
    if (ruta === pathname) {
      if (ancla) document.getElementById(ancla)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    router.push(n.link);
  }

  async function handleMarcarTodas() {
    const supabase = createClient();
    await marcarTodasLeidas(supabase, userId);
    setNotificaciones((prev) => prev?.map((x) => ({ ...x, leido: true })) ?? prev);
    setNoLeidas(0);
  }

  return (
    <div ref={panelRef} className="fixed right-4 top-4 z-40 print:hidden">
      <button
        type="button"
        onClick={abrirPanel}
        aria-label="Notificaciones"
        className="relative flex h-11 w-11 items-center justify-center rounded-[10px] border border-white/10 bg-portal-navy-dark text-white shadow-lg transition-colors hover:bg-portal-navy"
      >
        <PortalIcon name="notifications" className="text-[22px]" />
        {noLeidas > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-portal-orange px-1 text-[10px] font-bold text-white">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 top-14 w-80 max-w-[90vw] overflow-hidden rounded-[10px] border border-portal-surface-variant bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-portal-surface-variant px-4 py-3">
            <span className="text-sm font-bold text-portal-navy">Notificaciones</span>
            {noLeidas > 0 && (
              <button type="button" onClick={handleMarcarTodas} className="text-xs font-semibold text-portal-orange">
                Marcar todas como leídas
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {cargando && <div className="p-4 text-center text-sm text-portal-navy/50">Cargando...</div>}
            {!cargando && notificaciones?.length === 0 && (
              <div className="p-4 text-center text-sm text-portal-navy/50">Sin notificaciones todavía</div>
            )}
            {!cargando &&
              notificaciones?.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClickNotificacion(n)}
                  className={`flex w-full items-start gap-3 border-b border-portal-surface-variant/60 px-4 py-3 text-left last:border-b-0 hover:bg-portal-surface-low/60 ${
                    n.leido ? "" : "bg-portal-orange/5"
                  }`}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-portal-surface-low text-portal-orange">
                    <PortalIcon name={n.icon} className="text-[16px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-portal-navy">{n.titulo}</span>
                    <span className="block truncate text-xs text-portal-navy/60">{n.mensaje}</span>
                    <span className="mt-0.5 block text-[11px] text-portal-navy/40">
                      {formatFechaRelativa(n.created_at)}
                    </span>
                  </span>
                  {!n.leido && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-portal-orange" />}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
