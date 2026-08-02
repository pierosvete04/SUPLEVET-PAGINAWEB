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
    // Verde de WhatsApp. `whatsapp` es el color de marca reconocible pero solo
    // da 2:1 de contraste con texto blanco (WCAG pide 4.5:1), así que los
    // botones lo usan como extremo CLARO de un degradado cuyo extremo oscuro
    // (`whatsappDark`, el verde de la app) es el que sostiene el texto.
    whatsapp: "#25D366",
    whatsappDark: "#128C7E",
    // Lienzo exterior del correo (lo que rodea la columna navy). Un paso más
    // profundo que softGray para que el blanco no domine; es el mismo color
    // bakeado en el PNG de `pawTileUrl`, así que si el cliente bloquea imágenes
    // el fondo plano se ve idéntico salvo por las huellas.
    canvas: "#F0EEEA",
    border: "#F0EFED",
    textMuted: "#6B7280",
    textFaint: "#9CA3AF",
    error: "#C62828",
    errorLight: "#EF5350",
    success: "#2e7d32",
    successLight: "#4caf50",
    warnStart: "#f5d76e",
    // Ámbar legible sobre fondo claro — el `warnStart` amarillo solo sirve
    // dentro de degradados, como texto no llega al contraste mínimo.
    warn: "#B45309",
    // Fondos tintados de los AlertBox. Son versiones muy diluidas del color
    // semántico: el mensaje nunca depende solo del tinte, siempre lleva además
    // ícono y borde lateral (regla color-not-only).
    errorTint: "#FDF0EE",
    warnTint: "#FDF5E9",
    successTint: "#EEF5EF",
    infoTint: "#EDF4F5",
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
  // Patrón de huellas de 200x200 que se repite como fondo del lienzo exterior.
  // Se genera y sube con scripts/generate-email-paw-tile.mjs — editar ahí (no a
  // mano en R2) si cambia el color o la densidad.
  pawTileUrl: "https://pub-ad8cb8681bd8458ba537a43f6735a89d.r2.dev/branding/email-paw-tile.png",
  siteUrl: "https://suplevet.pe",
  portalUrl: "https://suplevet.pe/mi-cuenta",
  // .pe, no .com: el único buzón real es team@suplevet.pe y soporte@ es uno de
  // sus alias en Hostinger. `soporte@suplevet.com` (dominio que no es nuestro)
  // hacía rebotar toda respuesta de cliente que llegara por acá.
  supportEmail: "soporte@suplevet.pe",
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

// Íconos de los correos. Son PNG (no SVG ni emoji) porque Gmail elimina la
// etiqueta <svg> del cuerpo del correo y los emojis se dibujan distinto en cada
// sistema operativo y no se pueden teñir con los colores de marca. Se diseñan
// en SVG y se rasterizan con scripts/generate-email-icons.mjs — para agregar o
// cambiar uno se edita ese script y se vuelve a correr, nunca se sube a mano.
//
// La key codifica ícono-color-tamaño: el color va bakeado en el PNG porque un
// PNG no se puede recolorear por CSS en un cliente de correo. `size` es el
// tamaño de visualización; el archivo viene al doble para pantallas retina.
const ICONS_BASE = "https://pub-ad8cb8681bd8458ba537a43f6735a89d.r2.dev/branding/email-icons";

export const icons = {
  gift: { src: `${ICONS_BASE}/gift-orange-14.png`, size: 14, alt: "" },
  checkOrange: { src: `${ICONS_BASE}/circle-check-orange-14.png`, size: 14, alt: "" },
  sparkles: { src: `${ICONS_BASE}/sparkles-orange-14.png`, size: 14, alt: "" },
  clock: { src: `${ICONS_BASE}/clock-orange-14.png`, size: 14, alt: "" },
  package: { src: `${ICONS_BASE}/package-orange-14.png`, size: 14, alt: "" },
  packageCheck: { src: `${ICONS_BASE}/package-check-orange-14.png`, size: 14, alt: "" },
  truck: { src: `${ICONS_BASE}/truck-orange-14.png`, size: 14, alt: "" },
  rotateCcw: { src: `${ICONS_BASE}/rotate-ccw-orange-14.png`, size: 14, alt: "" },
  cart: { src: `${ICONS_BASE}/shopping-cart-orange-14.png`, size: 14, alt: "" },
  fileText: { src: `${ICONS_BASE}/file-text-orange-14.png`, size: 14, alt: "" },
  mailCheck: { src: `${ICONS_BASE}/mail-check-orange-14.png`, size: 14, alt: "" },
  keyRound: { src: `${ICONS_BASE}/key-round-orange-14.png`, size: 14, alt: "" },
  star: { src: `${ICONS_BASE}/star-orange-14.png`, size: 14, alt: "" },
  cake: { src: `${ICONS_BASE}/cake-orange-14.png`, size: 14, alt: "" },
  alertError: { src: `${ICONS_BASE}/circle-alert-error-14.png`, size: 14, alt: "" },
  xError: { src: `${ICONS_BASE}/circle-x-error-14.png`, size: 14, alt: "" },

  // Íconos de estado de los AlertBox. Estos SÍ llevan alt: son la señal no
  // cromática del mensaje, así que un lector de pantalla debe anunciarlos.
  alertWarnLg: { src: `${ICONS_BASE}/triangle-alert-warn-20.png`, size: 20, alt: "Atención" },
  alertErrorLg: { src: `${ICONS_BASE}/circle-x-error-20.png`, size: 20, alt: "Error" },
  alertSuccessLg: { src: `${ICONS_BASE}/circle-check-success-20.png`, size: 20, alt: "Listo" },
  alertInfoLg: { src: `${ICONS_BASE}/info-sky-20.png`, size: 20, alt: "Información" },

  lock: { src: `${ICONS_BASE}/lock-faint-14.png`, size: 14, alt: "" },
  clipboard: { src: `${ICONS_BASE}/clipboard-white-13.png`, size: 13, alt: "" },
  mapPin: { src: `${ICONS_BASE}/map-pin-navy-15.png`, size: 15, alt: "" },
  packageNavy: { src: `${ICONS_BASE}/package-navy-15.png`, size: 15, alt: "" },
  microscope: { src: `${ICONS_BASE}/microscope-sky-18.png`, size: 18, alt: "" },
  stethoscope: { src: `${ICONS_BASE}/stethoscope-sky-18.png`, size: 18, alt: "" },
  flagPe: { src: `${ICONS_BASE}/flag-pe-propio-18.png`, size: 18, alt: "" },
  whatsapp: { src: `${ICONS_BASE}/whatsapp-white-18.png`, size: 18, alt: "" },
  paw: { src: `${ICONS_BASE}/paw-orange-14.png`, size: 14, alt: "" },
  pawWhite: { src: `${ICONS_BASE}/paw-white-16.png`, size: 16, alt: "" },
} as const;

export type EmailIconName = keyof typeof icons;

// Escala de elevación. Outlook de escritorio ignora box-shadow por completo:
// no se rompe nada, simplemente degrada al diseño plano que había antes, así
// que ninguna jerarquía depende solo de la sombra.
export const shadows = {
  /** Tarjeta blanca principal sobre la columna navy. */
  card: "0 8px 40px rgba(0,0,0,.25)",
  /** Cajas de contenido dentro de la tarjeta (pasos, resumen, alertas). */
  raised: "0 4px 14px rgba(30,58,95,.10)",
  /** Sombra del color del propio botón — es lo que lo hace "flotar". */
  ctaOrange: "0 8px 20px rgba(224,104,48,.35)",
  ctaWhatsapp: "0 8px 20px rgba(18,140,126,.35)",
  ctaNavy: "0 8px 20px rgba(30,58,95,.22)",
} as const;

export const gradients = {
  orange: `linear-gradient(90deg,${brand.colors.orange},${brand.colors.orangeDark})`,
  whatsapp: `linear-gradient(135deg,${brand.colors.whatsapp},${brand.colors.whatsappDark})`,
  green: `linear-gradient(90deg,${brand.colors.successLight},${brand.colors.success})`,
  red: `linear-gradient(90deg,${brand.colors.errorLight},${brand.colors.error})`,
  warn: `linear-gradient(90deg,${brand.colors.warnStart},${brand.colors.orange})`,
  pinkOrange: `linear-gradient(90deg,${brand.colors.orange},#E85D75)`,
  sky: `linear-gradient(135deg,${brand.colors.sky},${brand.colors.skyDeep})`,
} as const;
