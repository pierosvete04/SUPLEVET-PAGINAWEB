// Datos reales de contacto/redes (PLAN.md sección 16.1).
// Hoy son constantes; cuando exista la tabla `site_settings` (Fase 4, panel
// admin) se reemplazan por una consulta a Supabase sin tocar los componentes
// que los usan, porque todos importan desde este único archivo.

export const siteConfig = {
  whatsappB2C: "51920723721", // consumidores — número conectado a Meta Cloud API (sección 19)
  whatsappB2B: "51943116820", // veterinarias/mayoristas — solo click-to-chat manual
  portalClientesUrl: "https://portal.suplevet.pe", // "Mi cuenta" — portal existente, no se reconstruye
  redesSociales: {
    facebook: "https://www.facebook.com/suplevetperu/",
    instagram: "https://www.instagram.com/suplevet.pe/",
    tiktok: "https://www.tiktok.com/@suplevet",
    linkedin: "https://pe.linkedin.com/company/suplevet",
  },
  legal: {
    razonSocial: "Nutrova for Pets S.A.C.",
    ruc: "20613665995",
    domicilioFiscal: "Calle Río Elba 132, La Molina, Lima, Perú",
    correoAtencion: "paolosvete04@gmail.com", // mismo correo que ya usa el Libro de Reclamaciones del portal
  },
} as const;

export function whatsappLink(numero: string, mensaje?: string) {
  const base = `https://wa.me/${numero}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}

export const mainNav = [
  { label: "Inicio", href: "/" },
  { label: "Productos", href: "/productos" },
  { label: "Ofertas", href: "/ofertas" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Blog", href: "/blog" },
  { label: "Contacto", href: "/contacto" },
] as const;
