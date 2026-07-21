import type { SupabaseClient } from "@supabase/supabase-js";

export interface OportunidadVentaja {
  id: string;
  icono: string;
  titulo: string;
  texto: string;
  orden: number;
  activo: boolean;
}

export async function getVentajasActivas(supabase: SupabaseClient): Promise<OportunidadVentaja[]> {
  const { data } = await supabase
    .from("oportunidad_ventajas")
    .select("id, icono, titulo, texto, orden, activo")
    .eq("activo", true)
    .order("orden", { ascending: true });
  return (data as OportunidadVentaja[]) ?? [];
}
