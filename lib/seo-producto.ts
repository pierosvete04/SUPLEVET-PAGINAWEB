import type { ProductoCombo } from "@/lib/data/productos-shared";

/**
 * Los campos SEO de un producto son opcionales: si el admin no los llena, se
 * derivan del nombre y la descripción de venta. Este módulo es el ÚNICO lugar
 * donde vive esa cadena de respaldos, para que la ficha, el feed de compras y
 * la vista previa del panel muestren exactamente lo mismo.
 */

/** Largos que Google recorta en el resultado de búsqueda. */
export const LARGO_META = {
  tituloMax: 60,
  descripcionMin: 120,
  descripcionMax: 155,
} as const;

/** Marca que se anexa al título cuando el admin no escribió uno propio. */
const SUFIJO_MARCA = " — Suplevet";

export interface SeoProducto {
  titulo: string;
  descripcion: string;
  /** Texto largo para el feed de compras y el JSON-LD. */
  descripcionLarga: string;
  imagenSocial: string;
  indexable: boolean;
}

type ProductoSeoInput = Pick<
  ProductoCombo,
  | "nombre"
  | "descripcion"
  | "imagen"
  | "metaTitulo"
  | "metaDescripcion"
  | "descripcionLarga"
  | "ogImagen"
  | "indexable"
>;

export function resolverSeoProducto(p: ProductoSeoInput): SeoProducto {
  return {
    // Sin meta_titulo el layout raíz aplica la plantilla "%s — Suplevet", que
    // sobre un nombre como "Suplevet 150g" produce "Suplevet 150g — Suplevet".
    // Por eso el respaldo arma el título completo acá y la página lo declara
    // con `absolute`, evitando la marca repetida.
    titulo: p.metaTitulo.trim() || `${p.nombre}${SUFIJO_MARCA}`,
    descripcion: p.metaDescripcion.trim() || p.descripcion,
    descripcionLarga: p.descripcionLarga.trim() || p.descripcion,
    imagenSocial: p.ogImagen.trim() || p.imagen,
    indexable: p.indexable,
  };
}

/** Diagnóstico de un campo de texto contra el largo que Google muestra. */
export type EstadoLargo = "vacio" | "corto" | "bien" | "largo";

export function evaluarLargo(texto: string, min: number, max: number): EstadoLargo {
  const largo = texto.trim().length;
  if (largo === 0) return "vacio";
  if (largo < min) return "corto";
  if (largo > max) return "largo";
  return "bien";
}
