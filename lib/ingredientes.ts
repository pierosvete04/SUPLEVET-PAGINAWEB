import type { SupabaseClient } from "@supabase/supabase-js";

export interface IngredienteProducto {
  id: string;
  nombre: string;
  titulo: string;
  beneficios: string[];
  orden: number;
  activo: boolean;
}

export async function getIngredientesActivos(
  supabase: SupabaseClient
): Promise<IngredienteProducto[]> {
  const { data } = await supabase
    .from("ingredientes_producto")
    .select("id, nombre, titulo, beneficios, orden, activo")
    .eq("activo", true)
    .order("orden", { ascending: true });
  return (data as IngredienteProducto[]) ?? [];
}
