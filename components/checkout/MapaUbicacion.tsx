"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cargarGoogleMaps } from "@/lib/google-maps-client";

interface MapaUbicacionProps {
  lat: number;
  lng: number;
  /** Se dispara al soltar el pin arrastrado, con las coordenadas ajustadas. */
  onMover: (coords: { lat: number; lng: number }) => void;
  /** Se está resolviendo la dirección del punto donde cayó el pin. */
  resolviendo?: boolean;
}

const ZOOM_INICIAL = 17;
// Dos posiciones más cercanas que esto son, en la práctica, la misma: ~1 cm.
const EPSILON_COORDENADA = 1e-7;

// Mapa de confirmación visual — el cliente ya eligió su dirección por texto en
// DireccionAutocomplete; esto le deja VER el pin sobre el mapa real y
// arrastrarlo si Google puso la marca en el lugar equivocado (pasa seguido en
// zonas nuevas o direcciones ambiguas). Lo que el courier usa de verdad es
// lat/lng, así que ajustar el pin es lo que corrige la entrega; el padre además
// reescribe la dirección de texto a partir de la nueva posición.
export function MapaUbicacion({ lat, lng, onMover, resolviendo = false }: MapaUbicacionProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<google.maps.Map | null>(null);
  const marcadorRef = useRef<google.maps.Marker | null>(null);
  // Última posición que salió de un arrastre. Sirve para distinguir "las props
  // cambiaron porque el usuario movió el pin" (no hay que tocar el mapa) de
  // "cambiaron porque eligió otra dirección en el buscador" (hay que recentrar).
  const posicionArrastradaRef = useRef<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  // El listener de `dragend` se registra una sola vez, así que llamarlo
  // directamente lo dejaría atado al onMover del primer render — y con él, al
  // resto del formulario tal como estaba en ese momento. Pasar por el ref
  // garantiza que el arrastre trabaje siempre sobre los datos actuales.
  const onMoverRef = useRef(onMover);
  useEffect(() => {
    onMoverRef.current = onMover;
  }, [onMover]);

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
          if (!posicion) return;
          const coords = { lat: posicion.lat(), lng: posicion.lng() };
          posicionArrastradaRef.current = coords;
          onMoverRef.current(coords);
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
  // recentra el mapa y mueve el marcador existente en vez de recrear todo el
  // mapa. Si el cambio viene del propio arrastre no se toca nada: el pin ya
  // está donde el usuario lo soltó y recentrar le movería el mapa bajo el dedo.
  useEffect(() => {
    if (!mapaRef.current || !marcadorRef.current) return;
    const arrastrada = posicionArrastradaRef.current;
    if (
      arrastrada &&
      Math.abs(arrastrada.lat - lat) < EPSILON_COORDENADA &&
      Math.abs(arrastrada.lng - lng) < EPSILON_COORDENADA
    ) {
      return;
    }
    posicionArrastradaRef.current = null;
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
        <p className="flex items-center gap-1.5 font-body text-xs text-muted-foreground">
          {resolviendo ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Actualizando la dirección con la nueva posición del pin…
            </>
          ) : (
            "Arrastra el pin si no cayó exactamente en tu puerta — la dirección de arriba se actualiza sola."
          )}
        </p>
      )}
    </div>
  );
}
