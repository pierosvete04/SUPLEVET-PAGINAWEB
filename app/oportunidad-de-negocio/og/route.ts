import sharp from "sharp";
import { getConfiguracionPublica } from "@/lib/data/publico";

// Miniatura que se ve al pegar el link de /oportunidad-de-negocio en WhatsApp,
// Facebook o LinkedIn. Existe como ruta propia (y no apuntando `og:image`
// directo al archivo de R2) por dos motivos:
//
//   1. Peso. La portada original pesa ~700 KB; WhatsApp descarta la miniatura
//      cuando pasa de ~600 KB y el link termina saliendo sin imagen. Acá se
//      re-codifica a JPEG de 1200x630 (~100 KB), que es justo el formato que
//      esperan los scrapers.
//   2. Sigue el contenido editable: la portada se cambia desde /admin y esta
//      ruta lee la misma configuración, así que la miniatura se actualiza sola
//      sin tocar código ni volver a subir un archivo aparte.
//
// Si algo falla (sin portada configurada, R2 caído, imagen corrupta) devuelve
// 302 a la imagen genérica del sitio: es preferible la miniatura del perro a un
// link sin previsualización.
// Misma imagen genérica que declara app/layout.tsx para todo el sitio.
const OG_FALLBACK =
  "https://bcahhdszzwearqaafhpa.supabase.co/storage/v1/object/public/productos-web-fotos/suplevet-150g/lifestyle-perro.jpg";

const ANCHO = 1200;
const ALTO = 630;

// Una hora: la portada casi nunca cambia y los scrapers cachean por su cuenta.
export const revalidate = 3600;

export async function GET() {
  const config = await getConfiguracionPublica();
  const portada = config?.oportunidad_hero_imagen ?? config?.oportunidad_hero_imagen_mobile;

  if (!portada) return Response.redirect(OG_FALLBACK, 302);

  try {
    const respuesta = await fetch(portada, { next: { revalidate } });
    if (!respuesta.ok) return Response.redirect(OG_FALLBACK, 302);

    const original = Buffer.from(await respuesta.arrayBuffer());
    const jpeg = await sharp(original)
      // `cover` + `attention` recorta al 1.91:1 que piden las redes centrando
      // la zona con más detalle (las personas), no el centro geométrico.
      .resize(ANCHO, ALTO, { fit: "cover", position: sharp.strategy.attention })
      .jpeg({ quality: 78, progressive: true })
      .toBuffer();

    return new Response(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch {
    return Response.redirect(OG_FALLBACK, 302);
  }
}
