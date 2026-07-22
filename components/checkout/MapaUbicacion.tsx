"use client";

import { useEffect, useRef, useState } from "react";
import { cargarGoogleMaps } from "@/lib/google-maps-client";

interface MapaUbicacionProps {
  lat: number;
  lng: number;
  /** Se dispara al soltar el pin arrastrado, con las coordenadas ajustadas. */
  onMover: (coords: { lat: number; lng: number }) => void;
}

const ZOOM_INICIAL = 17;

// Mapa de confirmación visual — el cliente ya eligió su dirección por texto en
// DireccionAutocomplete; esto solo le deja VER el pin sobre el mapa real y
// arrastrarlo unos metros si Google puso la marca en el lugar equivocado
// (pasa seguido en zonas nuevas o direcciones ambiguas). El texto de la
// dirección no cambia al arrastrar: lo que el courier usa de verdad es
// lat/lng, así que ajustar el pin es lo que realmente corrige la entrega.
export function MapaUbicacion({ lat, lng, onMover }: MapaUbicacionProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<google.maps.Map | null>(null);
  const marcadorRef = useRef<google.maps.Marker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let cancelado = false;

    cargarGoogleMaps()
      .then(() => {
        if (cancelado || !contenedorRef.current) return;

        const mapa = new google.maps.Map(contenedorRef.current, {
          center: { lat, lng },
          zoom: ZOOM_INICIAL,
          disableDefaultUI: true,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
        });
        const marcador = new google.maps.Marker({
          position: { lat, lng },
          map: mapa,
          draggable: true,
        });
        marcador.addListener("dragend", () => {
          const posicion = marcador.getPosition();
          if (posicion) onMover({ lat: posicion.lat(), lng: posicion.lng() });
        });

        mapaRef.current = mapa;
        marcadorRef.current = marcador;
        setListo(true);
      })
      .catch(() => {
        if (!cancelado) setError("No se pudo cargar el mapa.");
      });

    return () => {
      cancelado = true;
    };
    // Solo se inicializa una vez: los cambios posteriores de lat/lng los
    // maneja el efecto de abajo, que reposiciona el mapa ya creado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando lat/lng cambian por elegir OTRA dirección en el autocompletado
  // (no por arrastrar el pin, que ya está en su lugar), recentra el mapa y
  // mueve el marcador existente en vez de recrear todo el mapa.
  useEffect(() => {
    if (!mapaRef.current || !marcadorRef.current) return;
    const posicion = { lat, lng };
    mapaRef.current.setCenter(posicion);
    marcadorRef.current.setPosition(posicion);
  }, [lat, lng]);

  if (error) {
    return <p className="font-body text-xs text-destructive">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        ref={contenedorRef}
        className="h-48 w-full overflow-hidden rounded-md border border-border bg-soft-gray"
        aria-label="Mapa de la dirección de entrega"
      />
      {listo && (
        <p className="font-body text-xs text-muted-foreground">
          Arrastra el pin si no cayó exactamente en tu puerta.
        </p>
      )}
    </div>
  );
}
