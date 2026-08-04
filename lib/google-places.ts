// Cliente de Google Places (New) — SOLO servidor. La key nunca sale al
// navegador: el checkout habla con /api/direcciones/*, que reenvía a Google.
// Además de ocultar la key, esto evita que alguien la copie del bundle y nos
// queme la cuota, que se factura por búsqueda.
const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const DETAILS_URL = "https://places.googleapis.com/v1/places";
// Reverse geocoding vive en la Geocoding API, no en Places: Places resuelve
// texto → lugar, y acá necesitamos lo contrario (coordenadas del pin → texto).
const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

export interface SugerenciaDireccion {
  placeId: string;
  principal: string;
  secundario: string;
}

export interface ComponentesUbicacion {
  direccion: string;
  /** Nombres tal cual los devuelve Google; el llamador decide si matchean el ubigeo. */
  distrito: string | null;
  provincia: string | null;
  departamento: string | null;
  /** Código postal peruano (5 dígitos); Google no lo devuelve para todas las direcciones. */
  codigoPostal: string | null;
}

export interface DetalleDireccion extends ComponentesUbicacion {
  lat: number;
  lng: number;
}

interface ComponenteDireccion {
  longText?: string;
  shortText?: string;
  types?: string[];
}

interface PlacePrediction {
  placeId?: string;
  text?: { text?: string };
  structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
}

function componentePorTipo(componentes: ComponenteDireccion[], tipo: string): string | null {
  const encontrado = componentes.find((c) => c.types?.includes(tipo));
  return encontrado?.longText?.trim() || null;
}

// En Perú Google llena `postal_code` a medias: hay direcciones donde el código
// no viene como componente pero sí aparece dentro del texto formateado
// ("C. Rio Elba 132, La Molina 15024, Perú"). Se lee del penúltimo segmento —
// el que va antes de "Perú" — para no confundirlo con una numeración de calle
// de 5 dígitos, que vive en el primer segmento.
function codigoPostalDelTexto(direccionFormateada: string): string | null {
  const segmentos = direccionFormateada.split(",");
  if (segmentos.length < 2) return null;
  const penultimo = segmentos[segmentos.length - 2].trim();
  return penultimo.match(/\s(\d{5})$/)?.[1] ?? null;
}

function extraerUbicacion(
  componentes: ComponenteDireccion[],
  direccionFormateada: string
): ComponentesUbicacion {
  return {
    direccion: direccionFormateada,
    // En Perú Google no es consistente: el distrito a veces viene como
    // "locality" y a veces como administrative_area_level_3, así que se prueban
    // ambos antes de rendirse.
    distrito:
      componentePorTipo(componentes, "locality") ??
      componentePorTipo(componentes, "administrative_area_level_3"),
    provincia: componentePorTipo(componentes, "administrative_area_level_2"),
    departamento: componentePorTipo(componentes, "administrative_area_level_1"),
    codigoPostal:
      componentePorTipo(componentes, "postal_code") ??
      codigoPostalDelTexto(direccionFormateada),
  };
}

export function tieneApiKey(): boolean {
  return !!process.env.GOOGLE_MAPS_API_KEY;
}

export async function autocompletarDireccion(
  texto: string,
  sessionToken: string
): Promise<SugerenciaDireccion[]> {
  const r = await fetch(AUTOCOMPLETE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY!,
    },
    body: JSON.stringify({
      input: texto,
      sessionToken,
      languageCode: "es",
      // Restringido a Perú: no tiene sentido sugerir direcciones a las que no
      // enviamos, y acota los resultados a lo que el courier puede recorrer.
      includedRegionCodes: ["pe"],
    }),
    cache: "no-store",
  });

  if (!r.ok) throw new Error(`Places autocomplete respondió ${r.status}`);

  const data = await r.json();
  const sugerencias: { placePrediction?: PlacePrediction }[] = data.suggestions ?? [];

  return sugerencias
    .map((s) => s.placePrediction)
    .filter((p): p is PlacePrediction => !!p?.placeId)
    .map((p) => ({
      placeId: p.placeId!,
      principal: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
      secundario: p.structuredFormat?.secondaryText?.text ?? "",
    }));
}

export async function detalleDireccion(
  placeId: string,
  sessionToken: string
): Promise<DetalleDireccion | null> {
  const params = new URLSearchParams({ languageCode: "es", sessionToken });
  const r = await fetch(`${DETAILS_URL}/${encodeURIComponent(placeId)}?${params}`, {
    headers: {
      "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY!,
      // El field mask es obligatorio y además define cuánto cobra Google:
      // pedir solo estos 3 campos mantiene la llamada en el tier barato.
      "X-Goog-FieldMask": "formattedAddress,location,addressComponents",
    },
    cache: "no-store",
  });

  if (!r.ok) return null;

  const data = await r.json();
  if (typeof data.location?.latitude !== "number") return null;

  const componentes: ComponenteDireccion[] = data.addressComponents ?? [];
  return {
    ...extraerUbicacion(componentes, data.formattedAddress ?? ""),
    lat: data.location.latitude,
    lng: data.location.longitude,
  };
}

// La Geocoding API es la versión "clásica" y devuelve los componentes en
// snake_case (long_name/types), a diferencia de Places New (longText/types).
interface ResultadoGeocode {
  formatted_address?: string;
  address_components?: { long_name?: string; short_name?: string; types?: string[] }[];
  types?: string[];
}

function aComponentes(resultado: ResultadoGeocode): ComponenteDireccion[] {
  return (resultado.address_components ?? []).map((c) => ({
    longText: c.long_name,
    shortText: c.short_name,
    types: c.types,
  }));
}

// Precisión de mayor a menor. Se prefiere el primer resultado que sea una
// dirección con número de puerta; "route" (solo la calle) o el barrio sirven
// como respaldo, y recién al final se acepta lo que Google haya puesto primero.
const TIPOS_PREFERIDOS = ["street_address", "premise", "subpremise", "route"];

/**
 * Convierte las coordenadas del pin arrastrado en una dirección de texto.
 *
 * Google devuelve varios resultados para un mismo punto, cada vez más generales
 * (puerta → calle → barrio → distrito → país). Se elige el más preciso para el
 * texto, pero el código postal se busca en TODOS: es muy común que la dirección
 * exacta no lo traiga y sí lo tenga el resultado del distrito.
 */
export async function geocodificarInverso(
  lat: number,
  lng: number
): Promise<ComponentesUbicacion | null> {
  const params = new URLSearchParams({
    latlng: `${lat},${lng}`,
    language: "es",
    region: "pe",
    key: process.env.GOOGLE_MAPS_API_KEY!,
  });

  const r = await fetch(`${GEOCODE_URL}?${params}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`Geocoding respondió ${r.status}`);

  const data = await r.json();
  // La Geocoding API responde 200 con un status propio en el cuerpo; ZERO_RESULTS
  // es legítimo (el pin cayó en el mar o en una zona sin mapear), cualquier otro
  // status distinto de OK es un problema de configuración o de cuota.
  if (data.status === "ZERO_RESULTS") return null;
  if (data.status !== "OK") {
    // El error_message es lo único que distingue "falta habilitar la Geocoding
    // API en el proyecto" de "se acabó la cuota" o "la key no permite esta API".
    throw new Error(`Geocoding devolvió ${data.status}: ${data.error_message ?? "sin detalle"}`);
  }

  const resultados: ResultadoGeocode[] = data.results ?? [];
  if (resultados.length === 0) return null;

  const elegido =
    resultados.find((r) => r.types?.some((t) => TIPOS_PREFERIDOS.includes(t))) ?? resultados[0];

  const ubicacion = extraerUbicacion(aComponentes(elegido), elegido.formatted_address ?? "");
  if (ubicacion.codigoPostal) return ubicacion;

  const codigoDeOtroResultado = resultados
    .map((r) => extraerUbicacion(aComponentes(r), r.formatted_address ?? "").codigoPostal)
    .find((codigo): codigo is string => !!codigo);

  return { ...ubicacion, codigoPostal: codigoDeOtroResultado ?? null };
}
