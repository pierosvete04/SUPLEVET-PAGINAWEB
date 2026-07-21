// Coordenadas de entrega. Se guardan dentro de pedidos.direccion_envio (jsonb)
// junto al resto de la dirección, así el pedido conserva la ubicación con la
// que se despachó aunque el cliente después cambie su dirección de perfil.

export interface Coordenadas {
  lat: number;
  lng: number;
}

export function tieneCoordenadas(
  valor: { lat?: number | null; lng?: number | null } | null | undefined
): valor is Coordenadas {
  return typeof valor?.lat === "number" && typeof valor?.lng === "number";
}

/** Link para abrir la ubicación exacta; es el que se le pasa al motorizado. */
export function linkMaps({ lat, lng }: Coordenadas): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function formatCoordenadas({ lat, lng }: Coordenadas): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * Extrae coordenadas de un link de Google Maps pegado a mano — sirve para
 * pedidos viejos o cuando el cliente manda su ubicación por WhatsApp. Cubre
 * los formatos que Google usa hoy: /@lat,lng, ?q=lat,lng y !3dlat!4dlng.
 * Devuelve null si el texto no trae coordenadas reconocibles.
 */
export function coordenadasDesdeUrl(url: string): Coordenadas | null {
  // El orden importa: en un link de "place", !3d!4d es la posición exacta del
  // marcador, mientras que @lat,lng es solo el centro del mapa (puede estar a
  // cuadras del punto real). Se prueba lo preciso primero.
  // El segundo patrón acepta q= y query= porque Google usa ambos, y query= es
  // justamente el que genera linkMaps() acá abajo.
  const patrones = [
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /[?&](?:q|query)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
  ];

  for (const patron of patrones) {
    const m = url.match(patron);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (esCoordenadaValida(lat, lng)) return { lat, lng };
    }
  }

  // Último intento: el usuario pegó solo "-12.046374, -77.042793".
  const sueltas = url.trim().match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
  if (sueltas) {
    const lat = Number(sueltas[1]);
    const lng = Number(sueltas[2]);
    if (esCoordenadaValida(lat, lng)) return { lat, lng };
  }

  return null;
}

function esCoordenadaValida(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}
