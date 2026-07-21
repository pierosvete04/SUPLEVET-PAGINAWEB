import type { SupabaseClient } from "@supabase/supabase-js";

export type PaginaBanner = "productos" | "ofertas" | "ambas" | "home" | "hero";

export interface Banner {
  id: string;
  imagen: string;
  imagen_mobile: string | null;
  enlace: string | null;
  pagina: PaginaBanner;
  orden: number;
  activo: boolean;
}

export async function getBannersActivos(
  supabase: SupabaseClient,
  pagina: "productos" | "ofertas"
): Promise<Banner[]> {
  const { data } = await supabase
    .from("banners")
    .select("*")
    .eq("activo", true)
    .in("pagina", [pagina, "ambas"])
    .order("orden", { ascending: true });
  return (data as Banner[]) ?? [];
}

// "home" no participa de "ambas" — son solo las fotos del slider de
// "Nuevas presentaciones" en el Home, un carrusel decorativo sin CTA.
export async function getBannersHome(supabase: SupabaseClient): Promise<Banner[]> {
  const { data } = await supabase
    .from("banners")
    .select("*")
    .eq("activo", true)
    .eq("pagina", "home")
    .order("orden", { ascending: true });
  return (data as Banner[]) ?? [];
}

// "hero" es el banner de portada, arriba de todo (full-bleed) — independiente
// de "home", que es el carrusel de "Nuevas presentaciones" más abajo.
export async function getBannersHero(supabase: SupabaseClient): Promise<Banner[]> {
  const { data } = await supabase
    .from("banners")
    .select("*")
    .eq("activo", true)
    .eq("pagina", "hero")
    .order("orden", { ascending: true });
  return (data as Banner[]) ?? [];
}
