import { createClient } from "@/lib/supabase/server";
import type { ProductoCombo } from "@/lib/data/productos-shared";

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
  };
}

const FIELDS =
  "slug, nombre, descripcion, categoria, precio, precio_comparacion, imagen, galeria, descuento_porcentaje";

export async function getProductos(): Promise<ProductoCombo[]> {
  const supabase = await createClient();
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
  const supabase = await createClient();
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
    g150: g150 ? { nombre: g150.nombre, imagen: g150.imagen } : null,
    g250: g250 ? { nombre: g250.nombre, imagen: g250.imagen } : null,
  };
}
