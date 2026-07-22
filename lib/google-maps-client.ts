"use client";

// Carga perezosa del script de Maps JavaScript API — se dispara solo cuando
// el checkout realmente necesita dibujar el mapa (no en cada página del
// sitio) y se memoiza para que montar el mapa dos veces no inyecte el script
// dos veces.
//
// Se resuelve mediante el parámetro `callback`, NO con el evento `onload` del
// <script>: con `loading=async`, Google devuelve el control del script base
// antes de que `google.maps.Map`/`Marker` existan de verdad, así que esperar
// solo el onload causaba que el mapa fallara a cargar la primera vez (recién
// funcionaba al reintentar). El callback de Google sí espera a que la
// librería esté completamente lista.
declare global {
  interface Window {
    __inicializarGoogleMaps__?: () => void;
  }
}

const NOMBRE_CALLBACK = "__inicializarGoogleMaps__";

let cargaEnCurso: Promise<void> | null = null;

export function cargarGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps solo puede cargarse en el navegador"));
  }
  if (window.google?.maps) return Promise.resolve();
  if (cargaEnCurso) return cargaEnCurso;

  cargaEnCurso = new Promise((resolve, reject) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error("Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"));
      return;
    }
    window[NOMBRE_CALLBACK] = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&language=es&region=PE&callback=${NOMBRE_CALLBACK}`;
    script.async = true;
    script.onerror = () => reject(new Error("No se pudo cargar Google Maps"));
    document.head.appendChild(script);
  });

  return cargaEnCurso;
}
