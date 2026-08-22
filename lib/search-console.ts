// Cliente de la Google Search Console API — solo lectura, server-only.
// Trae las consultas reales por las que la web aparece en Google, con
// impresiones, clics, CTR y posición promedio, para poblar `seo_keywords`
// desde /admin/keywords.
//
// Credenciales en .env.local:
//   GSC_CLIENT_ID / GSC_CLIENT_SECRET  (opcionales: si faltan, se reusan las
//                                       de GTM — es el mismo proyecto de
//                                       Google Cloud)
//   GSC_REFRESH_TOKEN                  (propio: los scopes son distintos a
//                                       los de GTM, así que el token no se
//                                       puede compartir)
//   GSC_SITE_URL                       (la propiedad verificada, ej.
//                                       "sc-domain:suplevet.pe")
//
// Para generar el refresh token: node scripts/seo/get-refresh-token.mjs
import { google } from "googleapis";

/** Días de retraso con los que Google publica los datos. */
const DIAS_DE_RETRASO = 3;

/** Ventana por defecto: 28 días, la misma que usa la interfaz de Search Console. */
const DIAS_VENTANA = 28;

/**
 * Tope de filas por petición que acepta la API. Se pagina con `startRow`
 * hasta que Google devuelva menos de este número.
 */
const FILAS_POR_PAGINA = 25000;

export interface ConsultaBuscador {
  consulta: string;
  impresiones: number;
  clics: number;
  /** Fracción, no porcentaje: 0.042 = 4,2 %. */
  ctr: number;
  posicion: number;
  /** Página que más impresiones recibe para esta consulta. */
  pagina: string | null;
}

export interface RangoFechas {
  desde: string;
  hasta: string;
}

interface CredencialesOAuth {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

// La autenticación y la elección de propiedad se piden por separado a
// propósito: `listarPropiedades()` sirve justamente para descubrir qué poner
// en GSC_SITE_URL, así que no puede exigirlo de antemano.
function credencialesOAuth(): CredencialesOAuth | null {
  // El client id/secret identifican al proyecto de Google Cloud, no al
  // permiso: por eso pueden ser los mismos que ya usa GTM. El refresh token
  // sí es propio, porque codifica los scopes concedidos.
  const clientId = process.env.GSC_CLIENT_ID ?? process.env.GTM_CLIENT_ID;
  const clientSecret = process.env.GSC_CLIENT_SECRET ?? process.env.GTM_CLIENT_SECRET;
  const refreshToken = process.env.GSC_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) return null;
  return { clientId, clientSecret, refreshToken };
}

export function searchConsoleConfigurado(): boolean {
  return credencialesOAuth() !== null && Boolean(process.env.GSC_SITE_URL);
}

export const ERROR_NO_CONFIGURADO =
  "Search Console no está configurado — falta GSC_REFRESH_TOKEN o GSC_SITE_URL en .env.local " +
  "(corre scripts/seo/get-refresh-token.mjs y scripts/seo/list-sites.mjs).";

function clienteSearchConsole(creds: CredencialesOAuth) {
  const oauth2Client = new google.auth.OAuth2(creds.clientId, creds.clientSecret);
  oauth2Client.setCredentials({ refresh_token: creds.refreshToken });
  return google.searchconsole({ version: "v1", auth: oauth2Client });
}

function aISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/**
 * Ventana por defecto. No llega hasta hoy porque Search Console publica con
 * ~3 días de retraso: pedir los días más recientes devuelve ceros que
 * ensuciarían el promedio de posición.
 */
export function rangoPorDefecto(): RangoFechas {
  const hasta = new Date();
  hasta.setUTCDate(hasta.getUTCDate() - DIAS_DE_RETRASO);
  const desde = new Date(hasta);
  desde.setUTCDate(desde.getUTCDate() - DIAS_VENTANA);
  return { desde: aISO(desde), hasta: aISO(hasta) };
}

type FilaApi = { keys?: string[] | null; clicks?: number | null; impressions?: number | null; ctr?: number | null; position?: number | null };

/** Pide todas las filas de una consulta, paginando hasta agotarlas. */
async function consultarTodo(
  cliente: ReturnType<typeof clienteSearchConsole>,
  siteUrl: string,
  dimensions: string[],
  rango: RangoFechas
): Promise<FilaApi[]> {
  const filas: FilaApi[] = [];

  for (let startRow = 0; ; startRow += FILAS_POR_PAGINA) {
    const respuesta = await cliente.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: rango.desde,
        endDate: rango.hasta,
        dimensions,
        rowLimit: FILAS_POR_PAGINA,
        startRow,
        // Solo búsqueda web: Discover e Imágenes tienen otra dinámica y
        // mezclarlos distorsiona la posición promedio.
        type: "web",
      },
    });

    const pagina = respuesta.data.rows ?? [];
    filas.push(...pagina);
    if (pagina.length < FILAS_POR_PAGINA) break;
  }

  return filas;
}

/**
 * Consultas del período con su página de aterrizaje principal.
 *
 * Son dos llamadas a propósito. La primera agrupa solo por consulta, que es
 * la única forma de que Google entregue la posición promedio ya ponderada por
 * impresiones; calcularla a mano desde el desglose por página daría un
 * promedio simple, que es incorrecto. La segunda agrupa por consulta+página
 * únicamente para saber qué URL se lleva más impresiones de cada consulta.
 */
export async function obtenerConsultas(rango: RangoFechas): Promise<ConsultaBuscador[]> {
  const creds = credencialesOAuth();
  const siteUrl = process.env.GSC_SITE_URL;
  if (!creds || !siteUrl) throw new Error(ERROR_NO_CONFIGURADO);

  const cliente = clienteSearchConsole(creds);

  const [porConsulta, porConsultaYPagina] = await Promise.all([
    consultarTodo(cliente, siteUrl, ["query"], rango),
    consultarTodo(cliente, siteUrl, ["query", "page"], rango),
  ]);

  const paginaPrincipal = new Map<string, { pagina: string; impresiones: number }>();
  for (const fila of porConsultaYPagina) {
    const [consulta, pagina] = fila.keys ?? [];
    if (!consulta || !pagina) continue;

    const impresiones = fila.impressions ?? 0;
    const actual = paginaPrincipal.get(consulta);
    if (!actual || impresiones > actual.impresiones) {
      paginaPrincipal.set(consulta, { pagina, impresiones });
    }
  }

  return porConsulta
    .map((fila) => {
      const consulta = fila.keys?.[0];
      if (!consulta) return null;
      return {
        consulta,
        impresiones: fila.impressions ?? 0,
        clics: fila.clicks ?? 0,
        ctr: fila.ctr ?? 0,
        posicion: fila.position ?? 0,
        pagina: paginaPrincipal.get(consulta)?.pagina ?? null,
      };
    })
    .filter((c): c is ConsultaBuscador => c !== null);
}

/** Propiedades verificadas que este token puede leer — para configurar GSC_SITE_URL. */
export async function listarPropiedades(): Promise<string[]> {
  const creds = credencialesOAuth();
  if (!creds) throw new Error(ERROR_NO_CONFIGURADO);

  const cliente = clienteSearchConsole(creds);
  const respuesta = await cliente.sites.list({});
  return (respuesta.data.siteEntry ?? [])
    .map((s) => s.siteUrl)
    .filter((url): url is string => typeof url === "string");
}
