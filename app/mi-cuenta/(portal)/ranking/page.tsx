import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { NOMBRE_NIVEL } from "@/lib/data/portal/logros";

interface FilaRanking {
  rank: number;
  cliente_id: string;
  nombre_display: string;
  foto_url: string | null;
  puntos_historicos: number;
  nivel: string;
  mascotas_count: number;
}

const COLORES = ["#EA8C43", "#99D3DA", "#253C61", "#2b676d", "#c46e25", "#6fb5be"];
const MEDALLAS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default async function PortalRankingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("v_ranking")
    .select("rank, cliente_id, nombre_display, foto_url, puntos_historicos, nivel, mascotas_count")
    .order("rank", { ascending: true })
    .limit(50);

  const filas = (data as FilaRanking[]) ?? [];
  const top3 = filas.slice(0, 3);
  const miFila = filas.find((f) => f.cliente_id === user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="md:hidden">
        <h1 className="font-display text-3xl font-semibold text-portal-navy">Ranking</h1>
        <p className="mt-1 font-body text-sm text-portal-muted">Mira cómo te comparas con otros clientes.</p>
      </div>

      <div className="flex items-center justify-between rounded-[var(--radius-card)] bg-white p-4 shadow-sm">
        <span className="hidden font-body text-sm text-muted-foreground md:block">
          {filas.length} clientes en el ranking
        </span>
        <span className="font-body text-sm font-bold text-secondary">
          Tu posición: {miFila ? `#${miFila.rank}` : "—"}
        </span>
      </div>

      {top3.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {top3.map((u, i) => (
            <div
              key={u.cliente_id}
              className={`relative overflow-hidden rounded-[var(--radius-card)] p-4 ${
                u.rank === 1 ? "border-2 border-yellow-400 bg-yellow-50" : "border border-border bg-white"
              }`}
            >
              {u.rank === 1 && (
                <span className="absolute right-0 top-0 rounded-bl-lg rounded-tr-[inherit] bg-yellow-400 px-2.5 py-1 font-body text-[10px] font-bold text-yellow-900">
                  👑 #1
                </span>
              )}
              <div className="flex items-center gap-3">
                <div
                  className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full font-display text-lg font-bold text-white"
                  style={{ background: COLORES[i % COLORES.length] }}
                >
                  {u.foto_url ? (
                    <Image src={u.foto_url} alt="" fill className="object-cover" sizes="48px" />
                  ) : (
                    u.nombre_display.charAt(0).toUpperCase()
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-white text-xs">
                    {MEDALLAS[u.rank] ?? ""}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold text-secondary">{u.nombre_display}</p>
                  <p className="font-body text-[10px] text-muted-foreground">{u.mascotas_count ?? 0} mascotas</p>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <div className="text-right">
                  <p className="font-body text-[9px] font-bold uppercase text-muted-foreground">SuplePoints</p>
                  <p className="font-display text-xl font-bold text-secondary">
                    {u.puntos_historicos.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-[var(--radius-card)] bg-white shadow-sm">
        {filas.map((u) => {
          const esYo = u.cliente_id === user.id;
          return (
            <div
              key={u.cliente_id}
              className={`flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 ${
                esYo ? "bg-accent/10" : ""
              }`}
            >
              <span className="w-8 shrink-0 font-body text-sm font-bold text-muted-foreground">
                {MEDALLAS[u.rank] ?? `#${u.rank}`}
              </span>
              <div
                className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full font-body text-xs font-bold text-white"
                style={{ background: COLORES[u.rank % COLORES.length] }}
              >
                {u.foto_url ? (
                  <Image src={u.foto_url} alt="" fill className="object-cover" sizes="32px" />
                ) : (
                  u.nombre_display.charAt(0).toUpperCase()
                )}
              </div>
              <span className="flex-1 truncate font-body text-sm font-bold text-secondary">
                {u.nombre_display}
                {esYo && (
                  <span className="ml-2 rounded-full bg-primary px-2 py-0.5 font-body text-[9px] font-bold text-primary-foreground">
                    TÚ
                  </span>
                )}
              </span>
              <span className="w-16 shrink-0 text-right font-body text-xs text-muted-foreground">
                {NOMBRE_NIVEL[u.nivel] ?? u.nivel}
              </span>
              <span className="w-20 shrink-0 text-right font-display text-sm font-bold text-secondary">
                {u.puntos_historicos.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
