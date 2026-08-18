// Cliente de la TikTok Marketing API — solo lectura, server-only. Distinto
// del token de TIKTOK_EVENTS_API (esa es la Events API, para mandar
// conversiones; esta es la Marketing API, para LEER campañas/grupos de
// anuncios y su gasto). Mismo rol que lib/meta-ads.ts, mismo caso de uso:
// sincronizar `campanas_ads` / `campanas_ads_metricas_diarias`.
//
// Requiere tres variables de entorno:
//   TIKTOK_ADS_ACCESS_TOKEN — token de acceso Marketing API (se obtiene al
//     autorizar tu app de TikTok for Business sobre tu cuenta publicitaria)
//   TIKTOK_ADS_APP_ID / TIKTOK_ADS_APP_SECRET — de la app registrada en
//     business-api.tiktok.com (solo hacen falta para el endpoint que
//     descubre qué cuentas puede ver el token, /oauth2/advertiser/get/)
const TIKTOK_API_BASE = "https://business-api.tiktok.com/open_api/v1.3";

export interface TikTokCampania {
  id: string;
  nombre: string;
  estado: string;
  cuentaId: string;
}

export interface TikTokAdGroup {
  id: string;
  campanaId: string;
  nombre: string;
  estado: string;
  cuentaId: string;
}

export interface TikTokInsights {
  spend: number;
  impresiones: number;
  clics: number;
  videoViews: number;
  resultados: number;
  valorResultados: number;
}

export interface TikTokCuentaPublicitaria {
  id: string;
  nombre: string;
}

function credenciales(): { token: string; appId: string; appSecret: string } | null {
  const token = process.env.TIKTOK_ADS_ACCESS_TOKEN;
  const appId = process.env.TIKTOK_ADS_APP_ID;
  const appSecret = process.env.TIKTOK_ADS_APP_SECRET;
  if (!token || !appId || !appSecret) return null;
  return { token, appId, appSecret };
}

export function tiktokAdsConfigurado(): boolean {
  return credenciales() !== null;
}

const ERROR_NO_CONFIGURADO =
  "TikTok Ads no está configurado (faltan TIKTOK_ADS_ACCESS_TOKEN / TIKTOK_ADS_APP_ID / TIKTOK_ADS_APP_SECRET)";

// La API de TikTok siempre responde 200 y mete el error adentro del body
// (code !== 0), a diferencia de Meta que usa el status HTTP — por eso el
// chequeo de error acá es distinto al de llamarGraphApi en lib/meta-ads.ts.
async function llamarTikTokApi<T>(path: string, params: Record<string, unknown>, token: string): Promise<T> {
  const url = new URL(`${TIKTOK_API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    url.searchParams.set(key, typeof value === "string" ? value : JSON.stringify(value));
  }

  const r = await fetch(url.toString(), {
    headers: { "Access-Token": token, "Content-Type": "application/json" },
    cache: "no-store",
  });
  const body = await r.json();
  if (!r.ok || body.code !== 0) {
    throw new Error(body?.message ?? `TikTok Marketing API respondió código ${body?.code ?? r.status}`);
  }
  return body.data as T;
}

/** Todas las cuentas publicitarias que ese token puede ver — para el selector del admin. */
export async function listarCuentasPublicitarias(): Promise<TikTokCuentaPublicitaria[]> {
  const creds = credenciales();
  if (!creds) throw new Error(ERROR_NO_CONFIGURADO);

  const data = await llamarTikTokApi<{ list: { advertiser_id: string; advertiser_name: string }[] }>(
    "/oauth2/advertiser/get/",
    { app_id: creds.appId, secret: creds.appSecret },
    creds.token
  );
  return (data.list ?? []).map((a) => ({ id: a.advertiser_id, nombre: a.advertiser_name }));
}

export async function listarCampanias(cuentaIds: string[]): Promise<TikTokCampania[]> {
  const creds = credenciales();
  if (!creds) throw new Error(ERROR_NO_CONFIGURADO);

  const porCuenta = await Promise.all(
    cuentaIds.map((cuentaId) =>
      llamarTikTokApi<{ list: { campaign_id: string; campaign_name: string; operation_status: string }[] }>(
        "/campaign/get/",
        { advertiser_id: cuentaId, fields: ["campaign_id", "campaign_name", "operation_status"], page_size: 1000 },
        creds.token
      ).then((data) =>
        (data.list ?? []).map((c) => ({ id: c.campaign_id, nombre: c.campaign_name, estado: c.operation_status, cuentaId }))
      )
    )
  );
  return porCuenta.flat();
}

export async function listarConjuntosAnuncios(cuentaIds: string[]): Promise<TikTokAdGroup[]> {
  const creds = credenciales();
  if (!creds) throw new Error(ERROR_NO_CONFIGURADO);

  const porCuenta = await Promise.all(
    cuentaIds.map((cuentaId) =>
      llamarTikTokApi<{
        list: { adgroup_id: string; adgroup_name: string; operation_status: string; campaign_id: string }[];
      }>(
        "/adgroup/get/",
        {
          advertiser_id: cuentaId,
          fields: ["adgroup_id", "adgroup_name", "operation_status", "campaign_id"],
          page_size: 1000,
        },
        creds.token
      ).then((data) =>
        (data.list ?? []).map((a) => ({
          id: a.adgroup_id,
          campanaId: a.campaign_id,
          nombre: a.adgroup_name,
          estado: a.operation_status,
          cuentaId,
        }))
      )
    )
  );
  return porCuenta.flat();
}

interface ReportFila {
  dimensions: { campaign_id?: string; adgroup_id?: string; stat_time_day: string };
  metrics: {
    spend?: string;
    impressions?: string;
    clicks?: string;
    video_play_actions?: string;
    // El nombre exacto de la métrica de conversiones/valor depende del
    // objetivo de la campaña y de qué evento tenga configurado el pixel de
    // esa cuenta (compra, lead, etc.) — a diferencia de Meta, TikTok no
    // tiene un "action_type" universal como omni_purchase. Se piden los más
    // comunes para compras y se toma el primero que venga con datos; si la
    // cuenta no tiene ninguno configurado, queda en 0 (no se inventa nada).
    conversion?: string;
    total_onsite_shopping_value?: string;
  };
}

// "Resultados"/"valor de resultados" quedan en 0 si la cuenta no tiene
// conversiones de compra configuradas — mismo criterio honesto que Meta: se
// muestra lo que hay, no se estima nada.
function extraerNumero(valor: string | undefined): number {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function filaAInsights(fila: ReportFila | undefined): TikTokInsights {
  if (!fila) return { spend: 0, impresiones: 0, clics: 0, videoViews: 0, resultados: 0, valorResultados: 0 };
  return {
    spend: extraerNumero(fila.metrics.spend),
    impresiones: extraerNumero(fila.metrics.impressions),
    clics: extraerNumero(fila.metrics.clicks),
    videoViews: extraerNumero(fila.metrics.video_play_actions),
    resultados: extraerNumero(fila.metrics.conversion),
    valorResultados: extraerNumero(fila.metrics.total_onsite_shopping_value),
  };
}

const METRICAS_REPORTE = [
  "spend",
  "impressions",
  "clicks",
  "video_play_actions",
  "conversion",
  "total_onsite_shopping_value",
];

/**
 * Métricas día por día de TODAS las campañas (o TODOS los conjuntos) de una
 * cuenta a la vez — a diferencia de Meta, el endpoint de reportes de TikTok
 * no cuelga de la ruta de cada objeto, así que un solo llamado por cuenta
 * trae todo (más eficiente que pedirlo campaña por campaña).
 */
export async function obtenerInsightsDiariosPorCuenta(
  cuentaId: string,
  nivel: "campana" | "conjunto",
  desde: string,
  hasta: string
): Promise<Map<string, Map<string, TikTokInsights>>> {
  const creds = credenciales();
  if (!creds) throw new Error(ERROR_NO_CONFIGURADO);

  const dimensionId = nivel === "campana" ? "campaign_id" : "adgroup_id";
  const dataLevel = nivel === "campana" ? "AUCTION_CAMPAIGN" : "AUCTION_ADGROUP";

  const data = await llamarTikTokApi<{ list: ReportFila[] }>(
    "/report/integrated/get/",
    {
      advertiser_id: cuentaId,
      report_type: "BASIC",
      data_level: dataLevel,
      dimensions: [dimensionId, "stat_time_day"],
      metrics: METRICAS_REPORTE,
      start_date: desde,
      end_date: hasta,
      page_size: 1000,
    },
    creds.token
  );

  const porObjeto = new Map<string, Map<string, TikTokInsights>>();
  for (const fila of data.list ?? []) {
    const objectId = nivel === "campana" ? fila.dimensions.campaign_id : fila.dimensions.adgroup_id;
    if (!objectId) continue;
    const porFecha = porObjeto.get(objectId) ?? new Map<string, TikTokInsights>();
    porFecha.set(fila.dimensions.stat_time_day, filaAInsights(fila));
    porObjeto.set(objectId, porFecha);
  }
  return porObjeto;
}
