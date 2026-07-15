import type { SupabaseClient } from "@supabase/supabase-js";

export interface ComparativaFila {
  id: string;
  beneficio: string;
  suplevet_titulo: string;
  suplevet_texto: string;
  otros_titulo: string;
  otros_texto: string;
  orden: number;
  activo: boolean;
}

export async function getComparativaActiva(supabase: SupabaseClient): Promise<ComparativaFila[]> {
  const { data } = await supabase
    .from("comparativa_filas")
    .select("id, beneficio, suplevet_titulo, suplevet_texto, otros_titulo, otros_texto, orden, activo")
    .eq("activo", true)
    .order("orden", { ascending: true });
  return (data as ComparativaFila[]) ?? [];
}
