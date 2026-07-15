import type { SupabaseClient } from "@supabase/supabase-js";

export interface ValorNosotros {
  id: string;
  icono: string;
  titulo: string;
  texto: string;
  orden: number;
  activo: boolean;
}

export async function getValoresActivos(supabase: SupabaseClient): Promise<ValorNosotros[]> {
  const { data } = await supabase
    .from("valores_nosotros")
    .select("id, icono, titulo, texto, orden, activo")
    .eq("activo", true)
    .order("orden", { ascending: true });
  return (data as ValorNosotros[]) ?? [];
}
