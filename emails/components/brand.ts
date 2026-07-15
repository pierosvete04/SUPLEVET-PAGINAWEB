// Tokens de marca compartidos por todos los correos transaccionales.
// Mismos valores que ya usan los 7 correos de PORTAL DE CLIENTES/email-templates/*.html
// — no se usan los tokens genéricos que propuso Stitch (Manier Bold, paleta Material)
// porque no forman parte del sistema de marca real de Suplevet.
export const brand = {
  colors: {
    navy: "#1E3A5F",
    navyDark: "#142840",
    orange: "#F08C4B",
    orangeDark: "#E06830",
    sky: "#99D3DA",
    // Variante oscura del celeste de marca (secondary-fixed-variant del design
    // system) — se usa como fondo sólido de recuadros donde el celeste claro
    // no da suficiente contraste para texto blanco.
    skyDeep: "#2C7A82",
    softGray: "#F8F7F5",
    border: "#F0EFED",
    textMuted: "#6B7280",
    textFaint: "#9CA3AF",
    error: "#C62828",
    errorLight: "#EF5350",
    success: "#2e7d32",
    successLight: "#4caf50",
    warnStart: "#f5d76e",
  },
  // Bebas Neue = titulares (siempre mayúsculas). DM Sans = todo lo demás.
  fonts: {
    headline: "'Bebas Neue',Impact,'Arial Narrow',Arial,sans-serif",
    body: "'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif",
    mono: "'Courier New',monospace",
  },
  googleFontsHref:
    "https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&family=Bebas+Neue&display=swap",
  logoUrl: "https://portal.suplevet.pe/Logos%20suplevet-40.png",
  siteUrl: "https://suplevet.pe",
  portalUrl: "https://portal.suplevet.pe",
  supportEmail: "soporte@suplevet.com",
  // Mismas URLs que usa el footer del sitio (components/layout/Footer.tsx,
  // fallback de lib/site-config.ts) — un solo lugar si cambian. Los íconos son
  // los badges circulares blancos (glyph recortado) de public/icons/social-email/,
  // pensados para verse sobre el fondo navy del footer del correo.
  social: {
    facebook: { url: "https://www.facebook.com/suplevetperu/", icon: "https://suplevet.pe/icons/social-email/facebook.png" },
    whatsapp: { url: "https://wa.me/51920723721", icon: "https://suplevet.pe/icons/social-email/whatsapp.png" },
    instagram: { url: "https://www.instagram.com/suplevet.pe/", icon: "https://suplevet.pe/icons/social-email/instagram.png" },
    tiktok: { url: "https://www.tiktok.com/@suplevet", icon: "https://suplevet.pe/icons/social-email/tiktok.png" },
  },
} as const;

export const gradients = {
  orange: `linear-gradient(90deg,${brand.colors.orange},${brand.colors.orangeDark})`,
  green: `linear-gradient(90deg,${brand.colors.successLight},${brand.colors.success})`,
  red: `linear-gradient(90deg,${brand.colors.errorLight},${brand.colors.error})`,
  warn: `linear-gradient(90deg,${brand.colors.warnStart},${brand.colors.orange})`,
  pinkOrange: `linear-gradient(90deg,${brand.colors.orange},#E85D75)`,
  sky: `linear-gradient(135deg,${brand.colors.sky},${brand.colors.skyDeep})`,
} as const;
