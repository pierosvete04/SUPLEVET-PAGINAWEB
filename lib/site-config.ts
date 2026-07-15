// Datos reales de contacto/redes (PLAN.md sección 16.1).
// Hoy son constantes; cuando exista la tabla `site_settings` (Fase 4, panel
// admin) se reemplazan por una consulta a Supabase sin tocar los componentes
// que los usan, porque todos importan desde este único archivo.

export const siteConfig = {
  siteUrl: "https://suplevet.pe", // dominio de producción — usado en metadataBase, sitemap.ts, robots.ts y canonical
  whatsappB2C: "51920723721", // consumidores — número conectado a Meta Cloud API (sección 19)
  whatsappB2B: "51943116820", // veterinarias/mayoristas — solo click-to-chat manual
  whatsappDistribuidores: "51920289902", // Distribuidores estratégicos (Oportunidad de negocio) — click-to-chat manual
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
    correoAtencion: ["suplevetperu@gmail.com", "ventas@suplevet.pe"],
  },
  correoContacto: "ventas@suplevet.pe",
  horarioAtencion: "Lunes a viernes, 9:00 AM – 6:00 PM",
} as const;

export function whatsappLink(numero: string, mensaje?: string) {
  const base = `https://wa.me/${numero}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}

// Nav del Header — a propósito más corto que el menú completo del Footer
// (sin "Inicio", el logo ya lleva a "/") para calzar con el diseño de
// referencia. "Oportunidad de negocio" vive solo en el footer (columna MENÚ).
export const mainNav = [
  { label: "Ofertas", href: "/ofertas" },
  { label: "Productos", href: "/productos" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Blog", href: "/blog" },
  { label: "Contáctanos", href: "/contacto" },
] as const;
