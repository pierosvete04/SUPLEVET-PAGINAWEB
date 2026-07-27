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
  // Alojado en R2 (no en suplevet.pe/logos/...): ese dominio hoy sirve la
  // tienda Shopify vieja, no esta app, así que la ruta daba 404 en los
  // correos. R2 funciona sin depender de cuándo se lance el dominio nuevo.
  logoUrl: "https://pub-ad8cb8681bd8458ba537a43f6735a89d.r2.dev/branding/logo-white-mixed-horizontal.png",
  siteUrl: "https://suplevet.pe",
  portalUrl: "https://suplevet.pe/mi-cuenta",
  supportEmail: "soporte@suplevet.com",
  // Mismas URLs que usa el footer del sitio (components/layout/Footer.tsx,
  // fallback de lib/site-config.ts) — un solo lugar si cambian. `icon` es un
  // PNG blanco 40x40 alojado en R2 (mismo bucket que logoUrl): se probó
  // primero con data URI embebido, pero Gmail no lo renderiza dentro del
  // cuerpo del correo (sale como ícono roto) — necesita ser una URL http(s)
  // real como cualquier otra imagen de email.
  social: {
    facebook: {
      url: "https://www.facebook.com/suplevetperu/",
      label: "Facebook",
      icon: "https://pub-ad8cb8681bd8458ba537a43f6735a89d.r2.dev/branding/social/facebook.png",
    },
    whatsapp: {
      url: "https://wa.me/51920723721",
      label: "WhatsApp",
      icon: "https://pub-ad8cb8681bd8458ba537a43f6735a89d.r2.dev/branding/social/whatsapp.png",
    },
    instagram: {
      url: "https://www.instagram.com/suplevet.pe/",
      label: "Instagram",
      icon: "https://pub-ad8cb8681bd8458ba537a43f6735a89d.r2.dev/branding/social/instagram.png",
    },
    tiktok: {
      url: "https://www.tiktok.com/@suplevet",
      label: "TikTok",
      icon: "https://pub-ad8cb8681bd8458ba537a43f6735a89d.r2.dev/branding/social/tik-tok.png",
    },
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
