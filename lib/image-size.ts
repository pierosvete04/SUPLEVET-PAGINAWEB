import { readFile } from "node:fs/promises";
import path from "node:path";
import { unstable_cache } from "next/cache";
import type { ImageDimensions, MapaDimensiones } from "@/lib/images";

// ---------------------------------------------------------------------------
// Tamaño real (ancho x alto) de una imagen, leyendo solo su cabecera
// ---------------------------------------------------------------------------
// Para qué: los banners subidos desde /admin se muestran con <img> nativo y
// `w-full h-auto` porque no conocemos su proporción de antemano (ver
// lib/images.ts). Sin atributos width/height el navegador reserva alto CERO
// hasta que la imagen termina de descargar, y cuando llega empuja toda la
// página hacia abajo: eso es exactamente lo que PageSpeed mide como CLS
// (0.546 en mobile — el peor puntaje del informe de ago 2026).
//
// La solución no es forzar una proporción fija (recortaría banners), sino
// AVERIGUAR la proporción real. Esta función descarga solo los primeros
// KILOBYTES del archivo (cabecera) y saca de ahí el ancho/alto, sin bajar la
// imagen completa. El resultado se cachea por URL durante un día: un banner
// nunca cambia de tamaño sin cambiar de URL (el nombre lleva timestamp).
//
// Formatos soportados: PNG, JPEG, WebP y GIF — los que acepta el uploader.
// Si el formato es otro o la cabecera viene incompleta devuelve null, y el
// componente simplemente vuelve al comportamiento anterior (sin reserva de
// espacio) en vez de romperse.

/** Bytes de cabecera suficientes para todos los formatos soportados: en JPEG
 *  el marcador SOF (el que trae el tamaño) puede venir después de miniaturas
 *  EXIF, así que se pide con holgura. */
const HEADER_BYTES = 65536;

function parsePng(buf: Buffer): ImageDimensions | null {
  // Firma PNG + chunk IHDR: ancho y alto son big-endian en los offsets 16 y 20.
  if (buf.length < 24) return null;
  if (buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function parseGif(buf: Buffer): ImageDimensions | null {
  if (buf.length < 10 || buf.toString("ascii", 0, 3) !== "GIF") return null;
  return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
}

function parseWebp(buf: Buffer): ImageDimensions | null {
  if (buf.length < 30) return null;
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") return null;
  const formato = buf.toString("ascii", 12, 16);
  if (formato === "VP8 ") {
    // Lossy: dimensiones de 14 bits tras el start code de 3 bytes.
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (formato === "VP8L") {
    // Lossless: 14 bits de ancho y 14 de alto empaquetados en 4 bytes.
    const bits = buf.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (formato === "VP8X") {
    // Extendido: 24 bits por dimensión, menos uno.
    return {
      width: (buf.readUIntLE(24, 3) & 0xffffff) + 1,
      height: (buf.readUIntLE(27, 3) & 0xffffff) + 1,
    };
  }
  return null;
}

function parseJpeg(buf: Buffer): ImageDimensions | null {
  if (buf.length < 4 || buf.readUInt16BE(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset++; // relleno entre segmentos
      continue;
    }
    const marcador = buf[offset + 1];
    // SOF0..SOF15 traen el tamaño; se excluyen DHT (c4), JPG (c8) y DAC (cc),
    // que caen dentro del mismo rango pero no son "start of frame".
    const esSof =
      marcador >= 0xc0 && marcador <= 0xcf && marcador !== 0xc4 && marcador !== 0xc8 && marcador !== 0xcc;
    if (esSof) {
      return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
    }
    const longitud = buf.readUInt16BE(offset + 2);
    if (longitud < 2) return null;
    offset += 2 + longitud;
  }
  return null;
}

function parseDimensions(buf: Buffer): ImageDimensions | null {
  const dims = parsePng(buf) ?? parseJpeg(buf) ?? parseWebp(buf) ?? parseGif(buf);
  if (!dims || !dims.width || !dims.height) return null;
  return dims;
}

async function leerCabecera(src: string): Promise<Buffer | null> {
  // Rutas locales (/images/hero/...) viven en public/, no se piden por red.
  if (src.startsWith("/")) {
    try {
      return await readFile(path.join(process.cwd(), "public", src));
    } catch {
      return null;
    }
  }

  try {
    // Range evita descargar los megabytes del banner completo. Si el origen lo
    // ignora responde 200 con todo el archivo: igual funciona, solo pesa más.
    const res = await fetch(src, { headers: { Range: `bytes=0-${HEADER_BYTES - 1}` } });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function medir(src: string): Promise<ImageDimensions | null> {
  const buf = await leerCabecera(src);
  return buf ? parseDimensions(buf) : null;
}

/** Tamaño real de la imagen, cacheado un día por URL. Devuelve null si no se
 *  pudo determinar (formato no soportado, red caída, 404…). */
export async function getImageDimensions(src: string | null | undefined): Promise<ImageDimensions | null> {
  if (!src) return null;
  const cacheado = unstable_cache(() => medir(src), ["image-dimensions", src], {
    revalidate: 86400,
  });
  return cacheado();
}

/** Mide varias imágenes en paralelo y arma el mapa que consumen los
 *  componentes cliente (ver dimensionesImg en lib/images.ts). Las URLs
 *  repetidas o vacías se descartan. */
export async function medirImagenes(
  srcs: (string | null | undefined)[]
): Promise<MapaDimensiones> {
  const unicas = [...new Set(srcs.filter((s): s is string => Boolean(s)))];
  const medidas = await Promise.all(unicas.map((src) => getImageDimensions(src)));
  const mapa: MapaDimensiones = {};
  unicas.forEach((src, i) => {
    const dims = medidas[i];
    if (dims) mapa[src] = dims;
  });
  return mapa;
}
