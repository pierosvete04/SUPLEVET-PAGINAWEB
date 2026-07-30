// Tokens de sombra compartidos por los formularios del portal (mascota,
// perfil, etc.) para lograr el look de Figma: relleno claro sin borde,
// definido por sombra en vez de un borde visible.
export const SOMBRA_CAJA = "shadow-[0_2px_8px_rgba(30,58,95,0.10)]";
export const SOMBRA_TARJETA = "shadow-[0_6px_18px_rgba(30,58,95,0.12)]";
export const SOMBRA_FLOTANTE = "shadow-[0_10px_24px_rgba(30,58,95,0.18)]";

// Sin ancho incluido: permite componer con un ancho distinto a w-full (ej.
// un <select> nativo angosto) sin que dos utilidades de "width" choquen en
// la misma cadena de clases — un <select> no pasa por `cn`/tailwind-merge
// como sí lo hace el <Input> de shadcn, así que el empate lo resuelve el
// orden en que Tailwind genera el CSS, no el orden del className.
export const campoBase = `rounded-2xl border-0 bg-portal-surface-low/60 px-4 py-3 text-sm font-semibold text-portal-navy placeholder:font-normal placeholder:text-portal-muted ${SOMBRA_CAJA} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-portal-teal-light`;
export const inputBase = `w-full ${campoBase}`;
