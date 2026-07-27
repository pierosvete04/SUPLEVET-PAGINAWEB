// Uso: node scripts/upload-email-logo.mjs
// Sube el logo usado en emails/components/brand.ts a R2 en vez de depender de
// https://suplevet.pe (ese dominio hoy sirve la tienda Shopify vieja, no esta
// app — el logo 404eaba en los correos por eso). Mismo patrón que
// scripts/migrate-to-r2.mjs: key = `${carpeta}/${archivo}`.
import { readFileSync } from "node:fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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

const key = "branding/logo-white-mixed-horizontal.png";
const bytes = readFileSync(new URL("../public/logos/logo-white-mixed-horizontal.png", import.meta.url));

await r2.send(
  new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    Body: bytes,
    ContentType: "image/png",
  })
);

console.log(`Listo: ${env.R2_PUBLIC_URL}/${key}`);
