import type { SupabaseClient } from "@supabase/supabase-js";

export interface TestimonioVideo {
  id: string;
  titulo: string;
  video_url: string;
  thumbnail_url: string | null;
  orden: number;
  activo: boolean;
}

export async function getTestimoniosActivos(supabase: SupabaseClient): Promise<TestimonioVideo[]> {
  const { data } = await supabase
    .from("testimonios_videos")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });
  return (data as TestimonioVideo[]) ?? [];
}
