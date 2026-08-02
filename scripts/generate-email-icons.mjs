// Uso: node scripts/generate-email-icons.mjs
// Genera el set de íconos de los correos transaccionales y lo sube a R2.
//
// Por qué PNG y no SVG inline: Gmail elimina la etiqueta <svg> del cuerpo del
// correo y Outlook (motor Word) tampoco la renderiza — mismo motivo ya
// documentado en scripts/generate-email-paw-tile.mjs. Los íconos se DISEÑAN en
// SVG acá y se rasterizan a PNG @2x; el resultado visual es idéntico y sí llega
// a todos los clientes. Esto reemplaza a los emojis, que se veían distintos en
// cada sistema operativo y no se podían teñir con los colores de marca.
//
// El color va bakeado en el PNG (un PNG no se puede recolorear por CSS en
// correo), así que cada ícono se genera una vez por cada color en que se usa.
// La constante ICONOS de abajo es la fuente de verdad: si agregas una entrada,
// corre el script y luego referencia la key desde emails/components/brand.ts.
import { readFileSync } from "node:fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

// Mismos valores que brand.colors — duplicados acá a propósito porque este
// script corre en Node puro y no puede importar el .ts del bundle de Next.
const COLORES = {
  white: "#FFFFFF",
  navy: "#1E3A5F",
  orange: "#F08C4B",
  faint: "#9CA3AF",
  error: "#C62828",
  warn: "#B45309",
  success: "#2E7D32",
  sky: "#2C7A82",
};

// Tamaño en que se MUESTRA el ícono en el correo. El PNG se genera al doble
// para que se vea nítido en pantallas retina.
const ESCALA_RETINA = 2;

// Trazos tomados de Lucide (licencia ISC), el mismo set de íconos que usa la web
// en components/ — así el correo y el sitio hablan el mismo idioma visual.
const TRAZOS = {
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
  "circle-check": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  "circle-alert": '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  "circle-x": '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  "triangle-alert":
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  clipboard:
    '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
  package:
    '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  "package-check":
    '<path d="m16 16 2 2 4-4"/><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="m7.5 4.27 9 5.15"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  truck:
    '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  "rotate-ccw":
    '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  "shopping-cart":
    '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  "map-pin":
    '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  microscope:
    '<path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/>',
  stethoscope:
    '<path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>',
  "file-text":
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  "mail-check":
    '<path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="m16 19 2 2 4-4"/>',
  "key-round":
    '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><path d="M16.5 7.5h.01"/>',
  star: '<path d="M11.5 2.3a.53.53 0 0 1 .95 0l2.31 4.68a2.12 2.12 0 0 0 1.6 1.16l5.16.75a.53.53 0 0 1 .3.91l-3.74 3.64a2.12 2.12 0 0 0-.61 1.88l.88 5.14a.53.53 0 0 1-.77.56l-4.62-2.43a2.12 2.12 0 0 0-1.97 0L6.4 21.01a.53.53 0 0 1-.77-.56l.88-5.14a2.12 2.12 0 0 0-.61-1.88L2.16 9.8a.53.53 0 0 1 .29-.91l5.17-.75a2.12 2.12 0 0 0 1.6-1.16z"/>',
  cake: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/>',
  sparkles:
    '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
};

// Íconos de relleno (no de trazo): glifos de marca y la huella de Suplevet.
const RELLENOS = {
  // Glifo oficial de WhatsApp — va DENTRO del botón verde, así que el botón se
  // reconoce por forma y no solo por color (regla color-not-only de a11y).
  whatsapp:
    '<path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.25 8.24a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24m-3.6 4.1c-.17 0-.44.06-.67.31s-.88.86-.88 2.1.9 2.43 1.03 2.6c.12.16 1.76 2.68 4.27 3.76.6.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.48-.6 1.69-1.19s.21-1.08.15-1.19c-.06-.1-.23-.16-.48-.29s-1.48-.73-1.71-.81c-.23-.09-.4-.13-.56.12s-.64.81-.79.98c-.14.16-.29.19-.54.06s-1.05-.39-2-1.23c-.74-.66-1.24-1.47-1.38-1.72s-.02-.39.11-.51c.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41s.04-.31-.02-.43-.56-1.35-.77-1.85c-.2-.48-.4-.42-.55-.42z"/>',
  // Misma huella que el patrón de fondo (generate-email-paw-tile.mjs), acá en
  // versión sólida para acompañar a SuplePoints.
  paw: '<ellipse cx="12" cy="16" rx="5" ry="4.2"/><ellipse cx="5.7" cy="10.4" rx="2" ry="2.7" transform="rotate(-20 5.7 10.4)"/><ellipse cx="9.1" cy="7.6" rx="2" ry="2.8" transform="rotate(-8 9.1 7.6)"/><ellipse cx="14.9" cy="7.6" rx="2" ry="2.8" transform="rotate(8 14.9 7.6)"/><ellipse cx="18.3" cy="10.4" rx="2" ry="2.7" transform="rotate(20 18.3 10.4)"/>',
};

// La bandera peruana es el único ícono con colores propios (el rojo oficial,
// no la paleta de marca), así que se define aparte y no pasa por el sistema de
// tintado. Reemplaza al emoji 🇵🇪, que en Windows no se renderiza como bandera
// sino como las dos letras "PE".
const BANDERA_PE = `<rect x="1" y="5" width="7.33" height="14" rx="1.2" fill="#D91023"/><rect x="8.33" y="5" width="7.34" height="14" fill="#FFFFFF"/><rect x="15.67" y="5" width="7.33" height="14" rx="1.2" fill="#D91023"/><rect x="1" y="5" width="22" height="14" rx="1.2" fill="none" stroke="#E3E1DD" stroke-width="0.7"/>`;

/**
 * Cada entrada = un PNG en R2. `size` es el tamaño de VISUALIZACIÓN en px;
 * el archivo se genera a `size * ESCALA_RETINA`.
 */
const ICONOS = [
  // --- CategoryLabel (reemplazan a los emojis 🎁 🎉 🐾) ---
  { name: "gift", color: "orange", size: 14 },
  { name: "circle-check", color: "orange", size: 14 },
  { name: "sparkles", color: "orange", size: 14 },
  { name: "clock", color: "orange", size: 14 },
  { name: "package", color: "orange", size: 14 },
  { name: "package-check", color: "orange", size: 14 },
  { name: "truck", color: "orange", size: 14 },
  { name: "rotate-ccw", color: "orange", size: 14 },
  { name: "shopping-cart", color: "orange", size: 14 },
  { name: "file-text", color: "orange", size: 14 },
  { name: "mail-check", color: "orange", size: 14 },
  { name: "key-round", color: "orange", size: 14 },
  { name: "star", color: "orange", size: 14 },
  { name: "cake", color: "orange", size: 14 },
  { name: "circle-alert", color: "error", size: 14 },
  { name: "circle-x", color: "error", size: 14 },

  // --- AlertBox (ícono de estado, más grande) ---
  { name: "triangle-alert", color: "warn", size: 20 },
  { name: "circle-x", color: "error", size: 20 },
  { name: "circle-check", color: "success", size: 20 },
  { name: "info", color: "sky", size: 20 },

  // --- Notas y microcopy ---
  { name: "lock", color: "faint", size: 14 },
  { name: "clipboard", color: "white", size: 13 },
  { name: "map-pin", color: "navy", size: 15 },
  { name: "package", color: "navy", size: 15 },

  // --- Argumentos de venta del carrito abandonado ---
  { name: "microscope", color: "sky", size: 18 },
  { name: "stethoscope", color: "sky", size: 18 },
  { name: "flag-pe", color: "propio", size: 18, propio: true },

  // --- Marca / acciones ---
  { name: "whatsapp", color: "white", size: 18, relleno: true },
  { name: "paw", color: "orange", size: 14, relleno: true },
  { name: "paw", color: "white", size: 16, relleno: true },
];

function construirSvg({ name, color, size, relleno, propio }) {
  const px = size * ESCALA_RETINA;

  // Ícono con sus propios colores: se emite tal cual, sin tintar.
  if (propio) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 24 24">${BANDERA_PE}</svg>`;
  }

  const hex = COLORES[color];
  const cuerpo = relleno ? RELLENOS[name] : TRAZOS[name];
  if (!cuerpo) throw new Error(`No hay trazo definido para el ícono "${name}"`);

  const pintura = relleno
    ? `fill="${hex}"`
    : `fill="none" stroke="${hex}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 24 24" ${pintura}>${cuerpo}</svg>`;
}

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")];
    })
);

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

let total = 0;
for (const icono of ICONOS) {
  const svg = construirSvg(icono);
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  const key = `branding/email-icons/${icono.name}-${icono.color}-${icono.size}.png`;

  await r2.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: png,
      ContentType: "image/png",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  total += png.length;
  console.log(`  ${key} (${png.length} b)`);
}

console.log(`\nListo: ${ICONOS.length} íconos, ${(total / 1024).toFixed(1)} KB en total.`);
console.log(`Base: ${env.R2_PUBLIC_URL}/branding/email-icons/`);
