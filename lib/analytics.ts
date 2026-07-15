export const GTM_ID = "GTM-K48DWXBM";
export const GA_MEASUREMENT_ID = "G-23Q3WKB4V2";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

// Empuja un evento al dataLayer para que GTM lo capture con un trigger de
// "Custom Event" (nombre = eventName) y lo mande a GA4 u otra herramienta
// configurada ahí — ver README de la sección de analítica para la lista de
// eventos y cómo armar el trigger/tag en GTM.
export function trackEvent(eventName: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...params });
}
