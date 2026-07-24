// Uso: node scripts/migrate-to-r2.mjs
// Copia los archivos existentes de los buckets de Supabase Storage que ya
// tienen su código de subida apuntando a R2 (ver lib/uploadToR2.ts) hacia el
// bucket de R2, preservando la misma ruta relativa (bucket/carpeta/archivo)
// para que el reemplazo de URLs en la base de datos sea un simple prefix-swap.
// No borra nada en Supabase — eso se hace aparte, manualmente, una vez
// confirmado que todo carga bien desde R2.
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

const OBJETOS = [
  { bucket: "banners-fotos", name: "desktop/1784438887576-BANNER 2.png", mimetype: "image/png" },
  { bucket: "banners-fotos", name: "productos-ofertas/lo-mejor-para-tu-mascota-celeste.png", mimetype: "image/png" },
  { bucket: "productos-web-fotos", name: "combo-150g-x2/hero-estudio.png", mimetype: "image/png" },
  { bucket: "productos-web-fotos", name: "combo-250g-x2/hero-estudio.png", mimetype: "image/png" },
  { bucket: "productos-web-fotos", name: "combo-mix/hero-estudio.png", mimetype: "image/png" },
  { bucket: "productos-web-fotos", name: "hero/1784438712533-Banner para responsive.png", mimetype: "image/png" },
  { bucket: "productos-web-fotos", name: "hero/1784509364107-BANNER WEB.png", mimetype: "image/png" },
  { bucket: "productos-web-fotos", name: "suplevet-150g/frente.png", mimetype: "image/png" },
  { bucket: "productos-web-fotos", name: "suplevet-150g/hero-estudio.png", mimetype: "image/png" },
  { bucket: "productos-web-fotos", name: "suplevet-150g/lifestyle-gato.png", mimetype: "image/png" },
  { bucket: "productos-web-fotos", name: "suplevet-150g/lifestyle-perro.jpg", mimetype: "image/jpeg" },
  { bucket: "productos-web-fotos", name: "suplevet-150g/reverso.png", mimetype: "image/png" },
  { bucket: "productos-web-fotos", name: "suplevet-250g/frente.png", mimetype: "image/png" },
  { bucket: "productos-web-fotos", name: "suplevet-250g/hero-estudio.png", mimetype: "image/png" },
  { bucket: "productos-web-fotos", name: "suplevet-250g/lifestyle-gato.png", mimetype: "image/png" },
  { bucket: "productos-web-fotos", name: "suplevet-250g/lifestyle-perro.png", mimetype: "image/png" },
  { bucket: "productos-web-fotos", name: "suplevet-250g/reverso.png", mimetype: "image/png" },
  { bucket: "productos-web-videos", name: "suplevet-150g/dayan-panchito.mp4", mimetype: "video/mp4" },
  { bucket: "productos-web-videos", name: "suplevet-150g/entrevista-polo-vet.mp4", mimetype: "video/mp4" },
  { bucket: "productos-web-videos", name: "suplevet-150g/nala-y-lucca.mp4", mimetype: "video/mp4" },
  { bucket: "productos-web-videos", name: "suplevet-250g/entrevista-dr-rospigliosi.mp4", mimetype: "video/mp4" },
  { bucket: "productos-web-videos", name: "suplevet-250g/entrevista-erick-y-jack.mp4", mimetype: "video/mp4" },
  { bucket: "productos-web-videos", name: "suplevet-250g/entrevista-javier-y-maya.mp4", mimetype: "video/mp4" },
  { bucket: "testimonios-videos", name: "testimonios/dayan-panchito-poster.jpg", mimetype: "image/jpeg" },
  { bucket: "testimonios-videos", name: "testimonios/dayan-panchito.mp4", mimetype: "video/mp4" },
  { bucket: "testimonios-videos", name: "testimonios/entrevista-dr-rospigliosi-poster.jpg", mimetype: "image/jpeg" },
  { bucket: "testimonios-videos", name: "testimonios/entrevista-dr-rospigliosi.mp4", mimetype: "video/mp4" },
  { bucket: "testimonios-videos", name: "testimonios/entrevista-erick-y-jack-poster.jpg", mimetype: "image/jpeg" },
  { bucket: "testimonios-videos", name: "testimonios/entrevista-erick-y-jack.mp4", mimetype: "video/mp4" },
  { bucket: "testimonios-videos", name: "testimonios/entrevista-javier-y-maya-poster.jpg", mimetype: "image/jpeg" },
  { bucket: "testimonios-videos", name: "testimonios/entrevista-javier-y-maya.mp4", mimetype: "video/mp4" },
  { bucket: "testimonios-videos", name: "testimonios/entrevista-polo-vet-poster.jpg", mimetype: "image/jpeg" },
  { bucket: "testimonios-videos", name: "testimonios/entrevista-polo-vet.mp4", mimetype: "video/mp4" },
  { bucket: "testimonios-videos", name: "testimonios/nala-y-lucca-poster.jpg", mimetype: "image/jpeg" },
  { bucket: "testimonios-videos", name: "testimonios/nala-y-lucca.mp4", mimetype: "video/mp4" },
];

let ok = 0;
let fallidos = 0;

for (const obj of OBJETOS) {
  const sourceUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${obj.bucket}/${encodeURIComponent(obj.name).replace(/%2F/g, "/")}`;
  const key = `${obj.bucket}/${obj.name}`;
  process.stdout.write(`Copiando ${key} … `);
  try {
    const res = await fetch(sourceUrl);
    if (!res.ok) throw new Error(`descarga falló: ${res.status}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    await r2.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
        Body: bytes,
        ContentType: obj.mimetype,
      })
    );
    ok++;
    console.log("OK");
  } catch (err) {
    fallidos++;
    console.log("FALLÓ:", err.message);
  }
}

console.log(`\nListo: ${ok} copiados, ${fallidos} fallidos de ${OBJETOS.length}.`);
