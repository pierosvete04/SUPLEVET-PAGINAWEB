import type { SupabaseClient } from "@supabase/supabase-js";

// Fila única (id=1) de configuracion_sitio — ajustes editables desde
// /admin/configuracion sin necesitar un deploy. Cada página que consume un
// subconjunto de estos campos hace su propio `select` acotado.
export interface ConfiguracionSitio {
  whatsapp_b2c: string | null;
  whatsapp_b2b: string | null;
  whatsapp_distribuidores: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  linkedin_url: string | null;
  legal_razon_social: string | null;
  legal_ruc: string | null;
  legal_domicilio_fiscal: string | null;
  legal_correo_atencion: string | null;
  correo_contacto: string | null;
  horario_atencion: string | null;
  hero_titulo: string | null;
  hero_subtitulo: string | null;
  hero_banner_desktop: string | null;
  hero_banner_mobile: string | null;
  trustbar_texto_1: string | null;
  trustbar_texto_2: string | null;
  trustbar_texto_3: string | null;
  nosotros_hero_titulo: string | null;
  nosotros_hero_imagen: string | null;
  nosotros_quote: string | null;
  nosotros_origen_texto: string | null;
  nosotros_mision_texto: string | null;
  nosotros_vision_texto: string | null;
  nosotros_overlay_imagen: string | null;
  nosotros_overlay_titulo: string | null;
  nosotros_overlay_texto: string | null;
}

export async function getConfiguracionSitio(
  supabase: SupabaseClient
): Promise<ConfiguracionSitio | null> {
  const { data } = await supabase
    .from("configuracion_sitio")
    .select(
      "whatsapp_b2c, whatsapp_b2b, whatsapp_distribuidores, facebook_url, instagram_url, tiktok_url, linkedin_url, legal_razon_social, legal_ruc, legal_domicilio_fiscal, legal_correo_atencion, correo_contacto, horario_atencion, hero_titulo, hero_subtitulo, hero_banner_desktop, hero_banner_mobile, trustbar_texto_1, trustbar_texto_2, trustbar_texto_3, nosotros_hero_titulo, nosotros_hero_imagen, nosotros_quote, nosotros_origen_texto, nosotros_mision_texto, nosotros_vision_texto, nosotros_overlay_imagen, nosotros_overlay_titulo, nosotros_overlay_texto"
    )
    .eq("id", 1)
    .single();
  return (data as ConfiguracionSitio) ?? null;
}
