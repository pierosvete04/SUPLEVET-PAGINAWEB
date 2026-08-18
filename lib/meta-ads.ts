// Cliente de la Meta Marketing API (Graph API) — solo lectura, server-only.
// Trae campañas/conjuntos de anuncios y sus métricas para sincronizarlos a
// `campanas_ads` / `campanas_ads_metricas_diarias`. No modifica nada en Meta:
// los cambios reales se siguen haciendo en Meta Ads Manager.
//
// Requiere un System User Token con permiso `ads_read` (Configuración del
// negocio → Usuarios del sistema) — no una sesión personal, que expira. Una
// sola variable de entorno: META_ADS_ACCESS_TOKEN.
//
// Las cuentas publicitarias NO se configuran a mano: se descubren en vivo con
// `listarCuentasPublicitarias()` (todo lo que ese token puede ver) y el admin
// elige cuáles sincronizar desde /admin/campanas-ads — así, si mañana se crea
// una cuenta nueva, aparece sola en la lista sin tocar variables de entorno.
const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

export interface MetaCampania {
  id: string;
  nombre: string;
  estado: string;
  cuentaId: string;
}

export interface MetaConjuntoAnuncios {
  id: string;
  campanaId: string;
  nombre: string;
  estado: string;
  cuentaId: string;
}

export interface MetaInsights {
  spend: number;
  impresiones: number;
  clics: number;
  videoViews: number;
  resultados: number;
  /** Valor de las compras auto-atribuidas por Meta (para el "ROAS Meta"). */
  valorResultados: number;
}

export interface MetaCuentaPublicitaria {
  id: string;
  nombre: string;
}

function credenciales(): { token: string } | null {
  const token = process.env.META_ADS_ACCESS_TOKEN;
  return token ? { token } : null;
}

export function metaAdsConfigurado(): boolean {
  return credenciales() !== null;
}

async function llamarGraphApi<T>(path: string, params: Record<string, string>, token: string): Promise<T> {
  const url = new URL(`${GRAPH_API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("access_token", token);

  const r = await fetch(url.toString(), { cache: "no-store" });
  const data = await r.json();
  if (!r.ok) {
    const mensaje = data?.error?.message ?? `Meta Graph API respondió ${r.status}`;
    throw new Error(mensaje);
  }
  return data as T;
}

const ERROR_NO_CONFIGURADO = "Meta Ads no está configurado (falta META_ADS_ACCESS_TOKEN)";

/** Todas las cuentas publicitarias que ese token puede ver — para el selector del admin. */
export async function listarCuentasPublicitarias(): Promise<MetaCuentaPublicitaria[]> {
  const creds = credenciales();
  if (!creds) throw new Error(ERROR_NO_CONFIGURADO);

  const data = await llamarGraphApi<{ data: { id: string; name: string }[] }>(
    "/me/adaccounts",
    { fields: "id,name", limit: "200" },
    creds.token
  );
  return data.data.map((c) => ({ id: c.id, nombre: c.name }));
}

// Se piden por cuenta y se juntan los resultados. Los IDs de campaña/conjunto
// de Meta ya son únicos a nivel global, así que no hace falta prefijarlos por
// cuenta para evitar choques.
export async function listarCampanias(cuentaIds: string[]): Promise<MetaCampania[]> {
  const creds = credenciales();
  if (!creds) throw new Error(ERROR_NO_CONFIGURADO);

  const porCuenta = await Promise.all(
    cuentaIds.map((cuentaId) =>
      llamarGraphApi<{ data: { id: string; name: string; effective_status: string }[] }>(
        `/${cuentaId}/campaigns`,
        { fields: "id,name,effective_status", limit: "200" },
        creds.token
      ).then((data) => data.data.map((c) => ({ id: c.id, nombre: c.name, estado: c.effective_status, cuentaId })))
    )
  );
  return porCuenta.flat();
}

export async function listarConjuntosAnuncios(cuentaIds: string[]): Promise<MetaConjuntoAnuncios[]> {
  const creds = credenciales();
  if (!creds) throw new Error(ERROR_NO_CONFIGURADO);

  const porCuenta = await Promise.all(
    cuentaIds.map((cuentaId) =>
      llamarGraphApi<{
        data: { id: string; name: string; effective_status: string; campaign_id: string }[];
      }>(`/${cuentaId}/adsets`, { fields: "id,name,effective_status,campaign_id", limit: "500" }, creds.token).then(
        (data) =>
          data.data.map((a) => ({
            id: a.id,
            campanaId: a.campaign_id,
            nombre: a.name,
            estado: a.effective_status,
            cuentaId,
          }))
      )
    )
  );
  return porCuenta.flat();
}

interface InsightsRaw {
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: { action_type: string; value: string }[];
  action_values?: { action_type: string; value: string }[];
  video_play_actions?: { action_type: string; value: string }[];
}

// "Resultados" toma omni_purchase (compras auto-atribuidas por Meta) — es el
// número que se muestra al lado de, nunca sumado a, las ventas reales.
function extraerAccion(acciones: { action_type: string; value: string }[] | undefined, tipo: string): number {
  return Number(acciones?.find((a) => a.action_type === tipo)?.value ?? 0);
}

function filaAInsights(fila: InsightsRaw | undefined): MetaInsights {
  if (!fila) return { spend: 0, impresiones: 0, clics: 0, videoViews: 0, resultados: 0, valorResultados: 0 };
  return {
    spend: Number(fila.spend ?? 0),
    impresiones: Number(fila.impressions ?? 0),
    clics: Number(fila.clicks ?? 0),
    videoViews: extraerAccion(fila.video_play_actions, "video_view"),
    resultados: extraerAccion(fila.actions, "omni_purchase"),
    valorResultados: extraerAccion(fila.action_values, "omni_purchase"),
  };
}

/** Métricas de un objeto (campaña o conjunto) acumuladas para un rango. */
export async function obtenerInsights(objectId: string, desde: string, hasta: string): Promise<MetaInsights> {
  const creds = credenciales();
  if (!creds) throw new Error(ERROR_NO_CONFIGURADO);

  const data = await llamarGraphApi<{ data: InsightsRaw[] }>(
    `/${objectId}/insights`,
    {
      fields: "spend,impressions,clicks,actions,action_values,video_play_actions",
      time_range: JSON.stringify({ since: desde, until: hasta }),
    },
    creds.token
  );
  return filaAInsights(data.data[0]);
}

/**
 * Igual que `obtenerInsights`, pero desglosado día por día (`time_increment:
 * 1`) — sin esto, /insights devuelve UN solo total para todo el rango, no
 * sirve para armar una tendencia. Se usa para poblar
 * `campanas_ads_metricas_diarias` con un snapshot por fecha real.
 */
export async function obtenerInsightsDiarios(
  objectId: string,
  desde: string,
  hasta: string
): Promise<Map<string, MetaInsights>> {
  const creds = credenciales();
  if (!creds) throw new Error(ERROR_NO_CONFIGURADO);

  const data = await llamarGraphApi<{ data: (InsightsRaw & { date_start: string })[] }>(
    `/${objectId}/insights`,
    {
      fields: "spend,impressions,clicks,actions,action_values,video_play_actions",
      time_range: JSON.stringify({ since: desde, until: hasta }),
      time_increment: "1",
    },
    creds.token
  );

  const porFecha = new Map<string, MetaInsights>();
  for (const fila of data.data) {
    porFecha.set(fila.date_start, filaAInsights(fila));
  }
  return porFecha;
}
