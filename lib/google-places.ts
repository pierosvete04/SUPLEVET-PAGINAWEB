// Cliente de Google Places (New) — SOLO servidor. La key nunca sale al
// navegador: el checkout habla con /api/direcciones/*, que reenvía a Google.
// Además de ocultar la key, esto evita que alguien la copie del bundle y nos
// queme la cuota, que se factura por búsqueda.
const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const DETAILS_URL = "https://places.googleapis.com/v1/places";

export interface SugerenciaDireccion {
  placeId: string;
  principal: string;
  secundario: string;
}

export interface DetalleDireccion {
  direccion: string;
  lat: number;
  lng: number;
  /** Nombres tal cual los devuelve Google; el llamador decide si matchean el ubigeo. */
  distrito: string | null;
  provincia: string | null;
  departamento: string | null;
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
    direccion: data.formattedAddress ?? "",
    lat: data.location.latitude,
    lng: data.location.longitude,
    // En Perú Google no es consistente: el distrito a veces viene como
    // "locality" y a veces como administrative_area_level_3, así que se prueban
    // ambos antes de rendirse.
    distrito:
      componentePorTipo(componentes, "locality") ??
      componentePorTipo(componentes, "administrative_area_level_3"),
    provincia: componentePorTipo(componentes, "administrative_area_level_2"),
    departamento: componentePorTipo(componentes, "administrative_area_level_1"),
  };
}
