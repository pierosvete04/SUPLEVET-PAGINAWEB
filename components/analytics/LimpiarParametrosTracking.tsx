"use client";

import { useEffect } from "react";

// Parámetros que agrega Google por su cuenta al enlace (auto-etiquetado de
// Merchant Center) y que no aportan nada del lado del sitio: ensucian la barra
// de direcciones y, si el visitante copia la URL para compartirla, arrastra ese
// ruido. Se limpian solo de la barra de direcciones.
//
// A propósito NO se tocan utm_*, gclid, gbraid, wbraid ni fbclid: esos sí los
// necesitan Google Ads / Meta / GA4 para atribuir la venta a la campaña.
const PARAMETROS_A_LIMPIAR = ["srsltid"] as const;

// Nota: esto es cosmético. El parámetro lo agrega Google en el clic, así que la
// primera carga siempre llega con él; el arreglo de raíz es desactivar el
// auto-etiquetado en Merchant Center. Para SEO no hay problema en ningún caso:
// cada página declara su canonical limpio (alternates.canonical).
export function LimpiarParametrosTracking() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const habiaAlguno = PARAMETROS_A_LIMPIAR.some((p) => url.searchParams.has(p));
    if (!habiaAlguno) return;

    PARAMETROS_A_LIMPIAR.forEach((p) => url.searchParams.delete(p));

    // replaceState (no pushState): no debe crear una entrada extra en el
    // historial, o el botón "atrás" del navegador se quedaría dando vueltas
    // en la misma página.
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  return null;
}
