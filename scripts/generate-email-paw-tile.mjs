// Uso: node scripts/generate-email-paw-tile.mjs
// Genera el patrón de huellas que va de fondo en los correos y lo sube a R2.
//
// Por qué un PNG y no un SVG o un data URI: Gmail no renderiza SVG ni data URIs
// dentro del cuerpo del correo (mismo motivo documentado en emails/components/brand.ts
// para los íconos sociales), así que el patrón tiene que ser un PNG servido por
// una URL http(s) real. El color de fondo va BAKEADO en el PNG y además se
// declara como background-color en el layout: así los clientes que bloquean
// imágenes (y Outlook de escritorio) muestran el mismo gris plano sin que se
// note la ausencia del patrón.
import { readFileSync } from "node:fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const CANVAS = "#F0EEEA"; // brand.colors.canvas
const PAW = "#1E3A5F"; // brand.colors.navy, aplicado con opacidad baja
const PAW_OPACITY = 0.07;
const TILE = 200;

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

/** Una huella: almohadilla central + cuatro dedos, centrada en (0,0). */
function huella(escala) {
  const s = (n) => (n * escala).toFixed(2);
  return `
    <ellipse cx="0" cy="${s(6)}" rx="${s(9)}" ry="${s(7.5)}" />
    <ellipse cx="${s(-9.5)}" cy="${s(-4)}" rx="${s(3.6)}" ry="${s(4.8)}" transform="rotate(-20 ${s(-9.5)} ${s(-4)})" />
    <ellipse cx="${s(-3.4)}" cy="${s(-9)}" rx="${s(3.6)}" ry="${s(5)}" transform="rotate(-8 ${s(-3.4)} ${s(-9)})" />
    <ellipse cx="${s(3.4)}" cy="${s(-9)}" rx="${s(3.6)}" ry="${s(5)}" transform="rotate(8 ${s(3.4)} ${s(-9)})" />
    <ellipse cx="${s(9.5)}" cy="${s(-4)}" rx="${s(3.6)}" ry="${s(4.8)}" transform="rotate(20 ${s(9.5)} ${s(-4)})" />
  `;
}

// Posiciones repartidas para que al repetirse no se lea una cuadrícula obvia.
// Todas quedan holgadamente dentro del tile, así el mosaico calza sin cortes.
const huellas = [
  { x: 42, y: 38, rot: -18, escala: 1 },
  { x: 138, y: 74, rot: 22, escala: 0.85 },
  { x: 66, y: 132, rot: 8, escala: 0.92 },
  { x: 166, y: 168, rot: -12, escala: 0.78 },
];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}">
  <rect width="${TILE}" height="${TILE}" fill="${CANVAS}" />
  <g fill="${PAW}" fill-opacity="${PAW_OPACITY}">
    ${huellas
      .map(
        (h) =>
          `<g transform="translate(${h.x} ${h.y}) rotate(${h.rot})">${huella(h.escala)}</g>`
      )
      .join("\n    ")}
  </g>
</svg>`;

const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const key = "branding/email-paw-tile.png";

await r2.send(
  new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    Body: png,
    ContentType: "image/png",
    CacheControl: "public, max-age=31536000, immutable",
  })
);

console.log(`Listo (${png.length} bytes): ${env.R2_PUBLIC_URL}/${key}`);
