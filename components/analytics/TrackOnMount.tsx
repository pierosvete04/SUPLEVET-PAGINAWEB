"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

interface TrackOnMountProps {
  /** Nombre del evento que se empuja al dataLayer (ej. "view_item"). */
  evento: string;
  /** Parámetros del evento. Se mandan tal cual. */
  params?: Record<string, unknown>;
  /**
   * Cambia esto cuando el evento deba volver a dispararse dentro de la misma
   * página — por ejemplo el slug del producto al navegar entre fichas, que en
   * una SPA reusa el componente sin desmontarlo.
   */
  clave?: string;
}

/**
 * Dispara un evento de analítica al montar. Existe porque las páginas de
 * producto y listado son Server Components y no pueden llamar a trackEvent
 * directamente: este componente es el trozo de cliente mínimo para hacerlo.
 */
export function TrackOnMount({ evento, params, clave }: TrackOnMountProps) {
  const ultimaClave = useRef<string | null>(null);

  useEffect(() => {
    const claveActual = clave ?? evento;
    if (ultimaClave.current === claveActual) return;
    ultimaClave.current = claveActual;
    trackEvent(evento, params ?? {});
    // params se omite a propósito: es un objeto nuevo en cada render y
    // dispararía el efecto de más. La clave controla cuándo repetir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evento, clave]);

  return null;
}
