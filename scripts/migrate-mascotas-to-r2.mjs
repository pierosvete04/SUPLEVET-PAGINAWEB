// Uso: node scripts/migrate-mascotas-to-r2.mjs
// Igual que migrate-to-r2.mjs pero para el bucket mascotas-fotos (fotos de
// mascotas/perfil/historias subidas desde el portal de clientes).
// comunidad-fotos está vacío al momento de escribir esto, así que no
// necesita copia — solo el código ya apunta a R2 para lo nuevo.
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

const BUCKET = "mascotas-fotos";
const OBJETOS = [
  { name: "0250749d-79ca-4f1b-859e-0035a4333c3a/perfil/avatar.jpg", mimetype: "image/png" },
  { name: "244a4b3c-37b8-4e49-a65a-52f4c30f3087/perfil/avatar.jpg", mimetype: "image/jpeg" },
  { name: "466c21bc-e779-4020-9e2d-5b02f29de96a/3e530443-daf7-43f1-b97f-513ee1a51461/profile.jpg", mimetype: "image/jpeg" },
  { name: "466c21bc-e779-4020-9e2d-5b02f29de96a/59f62f0b-d72f-42da-a950-8c53c333a35d/profile.jpg", mimetype: "image/jpeg" },
  { name: "466c21bc-e779-4020-9e2d-5b02f29de96a/8b47eb6b-ab90-4ae9-9e3d-74169d45220d/profile.jpg", mimetype: "image/jpeg" },
  { name: "466c21bc-e779-4020-9e2d-5b02f29de96a/becfbfe6-ad33-4620-a003-5dcf25b26f02/profile.jpg", mimetype: "image/jpeg" },
  { name: "466c21bc-e779-4020-9e2d-5b02f29de96a/e40bf98e-6bce-451e-b5a1-345c8c89714b/profile.jpg", mimetype: "image/jpeg" },
  { name: "466c21bc-e779-4020-9e2d-5b02f29de96a/perfil/avatar.jpg", mimetype: "image/png" },
  { name: "466c21bc-e779-4020-9e2d-5b02f29de96a/stories/story_1778511525112", mimetype: "image/jpeg" },
  { name: "466c21bc-e779-4020-9e2d-5b02f29de96a/stories/story_1778511528707", mimetype: "image/jpeg" },
  { name: "466c21bc-e779-4020-9e2d-5b02f29de96a/stories/story_1778511647036", mimetype: "image/png" },
  { name: "c66c7bd2-4753-49d1-90ea-a448617d3a84/perfil/avatar.jpg", mimetype: "image/jpeg" },
  { name: "f107999c-9bc3-43ca-8b76-21b755a33d57/perfil/avatar.jpg", mimetype: "image/png" },
];

let ok = 0;
let fallidos = 0;

for (const obj of OBJETOS) {
  const sourceUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(obj.name).replace(/%2F/g, "/")}`;
  const key = `${BUCKET}/${obj.name}`;
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
