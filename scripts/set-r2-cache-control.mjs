// Uso: node scripts/set-r2-cache-control.mjs [--dry]
//
// Le pone Cache-Control de larga duración a los archivos que YA estaban en el
// bucket R2. Los que se suban de ahora en adelante ya salen con la cabecera
// puesta desde el propio momento de la subida (ver lib/r2.ts ->
// R2_CACHE_CONTROL y las rutas /api/*/r2-upload-url).
//
// Por qué hace falta: R2 servía estos archivos sin ninguna cabecera de caché,
// así que el navegador volvía a descargar los mismos banners y los 3,2 MB de
// videos en cada visita. PageSpeed lo reportaba como "usar tiempos de vida de
// caché eficientes" (1449 KiB en mobile, 2225 KiB en desktop).
//
// Cómo lo hace: no existe un "cambiar solo la cabecera" en S3/R2, así que se
// copia cada objeto sobre sí mismo con MetadataDirective REPLACE. El contenido
// no cambia y la URL tampoco — solo se reescriben sus metadatos.
//
// Es idempotente: correrlo dos veces no rompe nada. Con --dry solo lista lo
// que haría, sin tocar el bucket.
import { readFileSync } from "node:fs";
import {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";

const CACHE_CONTROL = "public, max-age=31536000, immutable";
const DRY = process.argv.includes("--dry");

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

const Bucket = env.R2_BUCKET_NAME;
const client = new S3Client({
  region: "auto",
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

let token;
let total = 0;
let actualizados = 0;

do {
  const lista = await client.send(
    new ListObjectsV2Command({ Bucket, ContinuationToken: token })
  );
  token = lista.NextContinuationToken;

  for (const { Key } of lista.Contents ?? []) {
    total++;
    const head = await client.send(new HeadObjectCommand({ Bucket, Key }));
    if (head.CacheControl === CACHE_CONTROL) continue;

    console.log(`${DRY ? "[dry] " : ""}${Key} (antes: ${head.CacheControl ?? "sin cabecera"})`);
    if (DRY) {
      actualizados++;
      continue;
    }

    await client.send(
      new CopyObjectCommand({
        Bucket,
        Key,
        // CopySource va con el bucket adelante y la clave codificada: sin
        // encodeURIComponent, las claves con espacios o acentos ("BANNER 2.png")
        // fallan con NoSuchKey.
        CopySource: `${Bucket}/${encodeURIComponent(Key)}`,
        MetadataDirective: "REPLACE",
        CacheControl: CACHE_CONTROL,
        // Sin repetirlo, el REPLACE lo borraría y R2 pasaría a servir los mp4
        // como application/octet-stream (el <video> dejaría de reproducirlos).
        ContentType: head.ContentType,
      })
    );
    actualizados++;
  }
} while (token);

console.log(`\n${actualizados} de ${total} objetos ${DRY ? "quedarían actualizados" : "actualizados"}.`);
