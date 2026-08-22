// Cliente de Google Ads API (Keyword Planner) — solo lectura, server-only.
// Genera ideas de keywords con volumen de búsqueda en Perú a partir de
// semillas (nombres de productos, o consultas que salieron de Search
// Console). Nunca crea ni modifica campañas.
//
// Se usa la API REST con fetch en vez del paquete `google-ads-api` a
// propósito: ese paquete arrastra gRPC y protobufs, y acá solo hace falta un
// endpoint. Mismo criterio que lib/meta-ads.ts.
//
// Credenciales en .env.local:
//   GADS_DEVELOPER_TOKEN     del API Center de la cuenta de administrador (MCC)
//   GADS_CUSTOMER_ID         cuenta que se consulta, solo dígitos
//   GADS_LOGIN_CUSTOMER_ID   la MCC, solo dígitos (opcional si son la misma)
//   GADS_CLIENT_ID/SECRET    opcionales: si faltan, se reusan las de GTM
//   GADS_REFRESH_TOKEN       propio (scope `adwords`)
//
// Para generar el refresh token: node scripts/seo/get-ads-refresh-token.mjs
import { google } from "googleapis";

/**
 * Google retira versiones de la Ads API cada pocos meses. Si la API empieza a
 * responder 404 o "version not supported", subir este número es lo primero
 * que hay que probar — la forma de la petición no suele cambiar.
 * Versiones vigentes: https://developers.google.com/google-ads/api/docs/sunset-dates
 */
const API_VERSION = "v21";

/**
 * Constantes de segmentación de Google. Los países usan el esquema 2 + código
 * ISO 3166-1 numérico (Perú = 604 → 2604); el español es el idioma 1003.
 * Referencia: https://developers.google.com/google-ads/api/data/geotargets
 */
const GEO_PERU = "geoTargetConstants/2604";
const IDIOMA_ESPANOL = "languageConstants/1003";

/** Tope de semillas que acepta el endpoint en una sola llamada. */
export const MAX_SEMILLAS = 20;

export interface IdeaKeyword {
  consulta: string;
  /** Búsquedas mensuales promedio. Google lo entrega redondeado en rangos amplios si la cuenta no tiene gasto activo. */
  volumenMensual: number;
  /** Normalizada a los valores que acepta el CHECK de `seo_keywords.competencia`. */
  competencia: "baja" | "media" | "alta" | null;
}

interface Credenciales {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  developerToken: string;
  customerId: string;
  loginCustomerId: string;
}

/** Google rechaza los IDs con guiones: "123-456-7890" tiene que viajar como "1234567890". */
function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

function credenciales(): Credenciales | null {
  // Igual que en Search Console: el client id/secret identifican al proyecto
  // de Google Cloud, no al permiso, así que pueden ser los mismos de GTM. El
  // refresh token sí es propio, porque el scope `adwords` es otro.
  const clientId = process.env.GADS_CLIENT_ID ?? process.env.GTM_CLIENT_ID;
  const clientSecret = process.env.GADS_CLIENT_SECRET ?? process.env.GTM_CLIENT_SECRET;
  const refreshToken = process.env.GADS_REFRESH_TOKEN;
  const developerToken = process.env.GADS_DEVELOPER_TOKEN;
  const customerId = process.env.GADS_CUSTOMER_ID;

  if (!clientId || !clientSecret || !refreshToken || !developerToken || !customerId) return null;

  return {
    clientId,
    clientSecret,
    refreshToken,
    developerToken,
    customerId: soloDigitos(customerId),
    // Si no se declara una MCC distinta, la cuenta se administra a sí misma.
    loginCustomerId: soloDigitos(process.env.GADS_LOGIN_CUSTOMER_ID ?? customerId),
  };
}

export function googleAdsConfigurado(): boolean {
  return credenciales() !== null;
}

export const ERROR_NO_CONFIGURADO =
  "Google Ads no está configurado — faltan GADS_DEVELOPER_TOKEN, GADS_CUSTOMER_ID o GADS_REFRESH_TOKEN " +
  "en .env.local (ver scripts/seo/get-ads-refresh-token.mjs).";

async function obtenerAccessToken(creds: Credenciales): Promise<string> {
  const oauth2Client = new google.auth.OAuth2(creds.clientId, creds.clientSecret);
  oauth2Client.setCredentials({ refresh_token: creds.refreshToken });

  const { token } = await oauth2Client.getAccessToken();
  if (!token) throw new Error("Google no devolvió un access token — revisa GADS_REFRESH_TOKEN.");
  return token;
}

const COMPETENCIA: Record<string, IdeaKeyword["competencia"]> = {
  LOW: "baja",
  MEDIUM: "media",
  HIGH: "alta",
};

interface RespuestaIdeas {
  results?: {
    text?: string;
    keywordIdeaMetrics?: {
      avgMonthlySearches?: string;
      competition?: string;
    };
  }[];
}

/**
 * Ideas de keywords para Perú en español a partir de semillas.
 *
 * Ojo con el volumen: si la cuenta de Google Ads no tiene campañas con gasto
 * activo, Google devuelve cifras muy redondeadas (rangos, no números finos).
 * Alcanza de sobra para decidir qué keyword atacar primero, pero no hay que
 * leerlo como una medición exacta.
 */
export async function generarIdeas(semillas: string[]): Promise<IdeaKeyword[]> {
  const creds = credenciales();
  if (!creds) throw new Error(ERROR_NO_CONFIGURADO);

  const limpias = semillas.map((s) => s.trim()).filter(Boolean).slice(0, MAX_SEMILLAS);
  if (limpias.length === 0) return [];

  const accessToken = await obtenerAccessToken(creds);

  const respuesta = await fetch(
    `https://googleads.googleapis.com/${API_VERSION}/customers/${creds.customerId}:generateKeywordIdeas`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": creds.developerToken,
        "login-customer-id": creds.loginCustomerId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        geoTargetConstants: [GEO_PERU],
        language: IDIOMA_ESPANOL,
        // Excluye keywords que Google marca como para adultos.
        includeAdultKeywords: false,
        keywordSeed: { keywords: limpias },
      }),
      cache: "no-store",
    }
  );

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    // La Ads API anida el mensaje útil bastante adentro; sin esto el admin
    // solo vería "400 Bad Request", que no dice nada accionable.
    const detalle =
      datos?.error?.details?.[0]?.errors?.[0]?.message ??
      datos?.error?.message ??
      `Google Ads respondió ${respuesta.status}`;
    throw new Error(detalle);
  }

  const { results = [] } = datos as RespuestaIdeas;

  return results
    .filter((r) => r.text)
    .map((r) => ({
      consulta: r.text!.toLowerCase().trim(),
      volumenMensual: Number(r.keywordIdeaMetrics?.avgMonthlySearches ?? 0),
      competencia: COMPETENCIA[r.keywordIdeaMetrics?.competition ?? ""] ?? null,
    }))
    .sort((a, b) => b.volumenMensual - a.volumenMensual);
}
