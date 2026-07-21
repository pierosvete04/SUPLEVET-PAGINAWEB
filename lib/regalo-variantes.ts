import type { SupabaseClient } from "@supabase/supabase-js";

export interface RegaloVariante {
  id: string;
  regalo_id: string;
  slug: string;
  nombre: string;
  imagen: string | null;
  orden: number;
  activo: boolean;
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
