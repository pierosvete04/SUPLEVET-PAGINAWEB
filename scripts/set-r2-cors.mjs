// Uso: node scripts/set-r2-cors.mjs
// Configura la política CORS del bucket R2 para permitir que el navegador
// suba archivos directo (PUT con URL firmada) desde el sitio de producción
// y desde localhost en desarrollo. Se corre una sola vez (o de nuevo si
// cambia el dominio); no se ejecuta en cada build.
import { readFileSync } from "node:fs";
import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

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

const client = new S3Client({
  region: "auto",
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

await client.send(
  new PutBucketCorsCommand({
    Bucket: env.R2_BUCKET_NAME,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: ["https://suplevet.pe", "http://localhost:3000"],
          AllowedMethods: ["PUT", "GET", "HEAD"],
          AllowedHeaders: ["*"],
          MaxAgeSeconds: 3000,
        },
      ],
    },
  })
);

console.log("CORS configurado en", env.R2_BUCKET_NAME);
