import { createStaticClient } from "@/lib/supabase/static";
import type { MetodoPago, ProductoCombo } from "@/lib/data/productos-shared";

// Cliente SIN cookies a propósito: el catálogo es idéntico para todo visitante
// (filtra `activo = true` con la clave anónima, las mismas políticas RLS que
// vería cualquiera). Usar el cliente con cookies obligaba a next/headers, y eso
// marcaba como dinámica CADA página que renderiza un producto — incluida la
// home, que monta CombosDestacados y PresentacionesShowcase. Ver lib/data/publico.ts.

interface ProductoWebRow {
  slug: string;
  nombre: string;
  descripcion: string;
  categoria: "producto" | "combo";
  precio: number;
  precio_comparacion: number;
  imagen: string;
  galeria: string[];
  descuento_porcentaje: number;
  videos: string[];
  shopify_product_id: string | null;
  metodos_pago_permitidos: MetodoPago[];
  sku: string | null;
  stock: number | null;
  meta_titulo: string;
  meta_descripcion: string;
  descripcion_larga: string;
  gtin: string | null;
  og_imagen: string;
  indexable: boolean;
}

function mapRow(row: ProductoWebRow): ProductoCombo {
  return {
    slug: row.slug,
    nombre: row.nombre,
    descripcion: row.descripcion,
    categoria: row.categoria,
    precio: Number(row.precio),
    precioComparacion: Number(row.precio_comparacion),
    imagen: row.imagen,
    galeria: row.galeria,
    descuentoPorcentaje: row.descuento_porcentaje,
    videos: row.videos ?? [],
    shopifyProductId: row.shopify_product_id,
    metodosPagoPermitidos: row.metodos_pago_permitidos,
    sku: row.sku,
    stock: row.stock,
    metaTitulo: row.meta_titulo ?? "",
    metaDescripcion: row.meta_descripcion ?? "",
    descripcionLarga: row.descripcion_larga ?? "",
    gtin: row.gtin,
    ogImagen: row.og_imagen ?? "",
    indexable: row.indexable ?? true,
  };
}

const FIELDS =
  "slug, nombre, descripcion, categoria, precio, precio_comparacion, imagen, galeria, descuento_porcentaje, videos, shopify_product_id, metodos_pago_permitidos, sku, stock, meta_titulo, meta_descripcion, descripcion_larga, gtin, og_imagen, indexable";

export async function getProductos(): Promise<ProductoCombo[]> {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from("productos_web")
    .select(FIELDS)
    .eq("activo", true)
    .order("orden", { ascending: true });
  return ((data as ProductoWebRow[]) ?? []).map(mapRow);
}

export async function getCombos(): Promise<ProductoCombo[]> {
  const productos = await getProductos();
  return productos.filter((p) => p.categoria === "combo");
}

export async function getProductoBySlug(slug: string): Promise<ProductoCombo | null> {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from("productos_web")
    .select(FIELDS)
    .eq("slug", slug)
    .eq("activo", true)
    .single();
  return data ? mapRow(data as ProductoWebRow) : null;
}

export async function getPresentaciones() {
  const productos = await getProductos();
  const g150 = productos.find((p) => p.slug === "suplevet-150g");
  const g250 = productos.find((p) => p.slug === "suplevet-250g");
  return {
    g150: g150 ?? null,
    g250: g250 ?? null,
  };
}
