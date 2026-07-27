import { S3Client } from "@aws-sdk/client-s3";

// Server-only: este módulo usa R2_SECRET_ACCESS_KEY, nunca debe importarse
// desde un componente "use client". R2 expone una API compatible con S3 en
// https://<ACCOUNT_ID>.r2.cloudflarestorage.com — "auto" como región es lo
// que documenta Cloudflare para el SDK de AWS.
function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta ${name} en las variables de entorno (ver .env.local)`);
  }
  return value;
}

export const R2_BUCKET = requiredEnv("R2_BUCKET_NAME");

const accountId = requiredEnv("CLOUDFLARE_ACCOUNT_ID");

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
  },
});

// La variable de entorno R2_PUBLIC_URL en Vercel quedó guardada como
// "//pub-....r2.dev" (sin "https:") mientras que .env.local sí lo tenía —
// esa URL sin esquema explícito rompe al componente next/image (devuelve 400
// al pedir /_next/image?url=//pub-...) aunque el navegador la resuelva bien
// en un <img> normal. Se normaliza acá para no depender de que cada entorno
// tenga el valor guardado exactamente igual.
function normalizarBaseUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url.replace(/^\/+/, "")}`;
}

export function r2PublicUrl(key: string): string {
  const publicUrl = normalizarBaseUrl(requiredEnv("R2_PUBLIC_URL"));
  return `${publicUrl}/${key}`;
}
