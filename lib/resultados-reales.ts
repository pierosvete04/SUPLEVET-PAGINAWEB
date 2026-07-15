import type { SupabaseClient } from "@supabase/supabase-js";

export interface ResultadoReal {
  id: string;
  titulo: string;
  semanas: number;
  foto_antes_url: string | null;
  foto_despues_url: string | null;
  orden: number;
  activo: boolean;
}

export async function getResultadosRealesActivos(
  supabase: SupabaseClient
): Promise<ResultadoReal[]> {
  const { data } = await supabase
    .from("resultados_reales")
    .select("id, titulo, semanas, foto_antes_url, foto_despues_url, orden, activo")
    .eq("activo", true)
    .order("orden", { ascending: true });
  return (data as ResultadoReal[]) ?? [];
}
