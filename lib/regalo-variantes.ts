import type { SupabaseClient } from "@supabase/supabase-js";

export type TallaBandana = "S" | "M" | "L";

export interface RegaloVariante {
  id: string;
  regalo_id: string;
  slug: string;
  nombre: string;
  imagen: string | null;
  orden: number;
  activo: boolean;
  talla: TallaBandana;
  /** null = stock ilimitado. */
  stock: number | null;
}

// Variantes activas de un regalo (ej. los 4 diseños de bandana), para
// mostrar como opciones al cliente en el carrito y en la ficha de producto.
export async function getVariantesActivas(
  supabase: SupabaseClient,
  regaloId: string
): Promise<RegaloVariante[]> {
  const { data } = await supabase
    .from("regalo_variantes")
    .select("*")
    .eq("regalo_id", regaloId)
    .eq("activo", true)
    .order("orden", { ascending: true });
  return (data as RegaloVariante[]) ?? [];
}

// Resuelve una variante por su slug sin filtrar por activo — se usa para
// mostrar el regalo elegido en un pedido ya hecho, aunque luego se desactive.
export async function getVariantePorSlug(
  supabase: SupabaseClient,
  slug: string | null
): Promise<RegaloVariante | null> {
  if (!slug) return null;
  const { data } = await supabase
    .from("regalo_variantes")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as RegaloVariante) ?? null;
}

// Resuelve varias variantes a la vez (ej. las N bandanas elegidas en un
// pedido con varios combos) — sin filtrar por activo, mismo motivo que
// getVariantePorSlug. El orden de salida no está garantizado; el llamador
// debe reordenar por slug si necesita mantener el orden de elección original.
export async function getVariantesPorSlugs(
  supabase: SupabaseClient,
  slugs: string[]
): Promise<RegaloVariante[]> {
  if (slugs.length === 0) return [];
  const { data } = await supabase.from("regalo_variantes").select("*").in("slug", slugs);
  return (data as RegaloVariante[]) ?? [];
}

// Todas las variantes de un regalo (incluye inactivas) — para la vista de
// administración en /admin/regalos/[id].
export async function getVariantesDeRegalo(
  supabase: SupabaseClient,
  regaloId: string
): Promise<RegaloVariante[]> {
  const { data } = await supabase
    .from("regalo_variantes")
    .select("*")
    .eq("regalo_id", regaloId)
    .order("orden", { ascending: true });
  return (data as RegaloVariante[]) ?? [];
}

export interface DisenoBandana {
  nombre: string;
  imagen: string | null;
  porTalla: Partial<Record<TallaBandana, RegaloVariante>>;
}

// Agrupa las filas diseño+talla (regalo_variantes) por diseño — usado tanto
// en el selector del carrito/checkout como en la sección de la home, para no
// duplicar la misma lógica de agrupación en ambos lados.
export function agruparVariantesPorDiseno(variantes: RegaloVariante[]): DisenoBandana[] {
  const grupos = new Map<string, DisenoBandana>();
  for (const v of variantes) {
    const grupo = grupos.get(v.nombre) ?? { nombre: v.nombre, imagen: v.imagen, porTalla: {} };
    grupo.porTalla[v.talla] = v;
    grupos.set(v.nombre, grupo);
  }
  return Array.from(grupos.values());
}

export function tallaBandanaDisponible(diseno: DisenoBandana, talla: TallaBandana): boolean {
  const v = diseno.porTalla[talla];
  return !!v && v.activo && (v.stock === null || v.stock > 0);
}
