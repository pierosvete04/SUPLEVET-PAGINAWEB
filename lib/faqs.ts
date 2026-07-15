import type { SupabaseClient } from "@supabase/supabase-js";

export interface Faq {
  id: string;
  pregunta: string;
  respuesta: string;
  orden: number;
  activo: boolean;
}

export async function getFaqsActivas(supabase: SupabaseClient): Promise<Faq[]> {
  const { data } = await supabase
    .from("faqs")
    .select("id, pregunta, respuesta, orden, activo")
    .eq("activo", true)
    .order("orden", { ascending: true });
  return (data as Faq[]) ?? [];
}
