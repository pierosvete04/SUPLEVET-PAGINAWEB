"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { traducirErrorSupabase } from "@/lib/errores-supabase";
import { revalidarSitioPublico } from "@/lib/revalidar-publico";

// Fila de configuracion_sitio tal como la edita el panel. Es un supraconjunto
// de la que consume el sitio público (lib/data/configuracion.ts): acá se cargan
// TODAS las columnas porque el guardado reescribe la fila completa.
export interface ConfiguracionSitioAdmin {
  announcement_bar_activo: boolean;
  announcement_bar_texto: string | null;
  announcement_bar_link: string | null;
  yape_plin_numero: string | null;
  yape_plin_titular: string | null;
  yape_plin_qr_url: string | null;
  banco_nombre: string | null;
  banco_cuenta: string | null;
  banco_cci: string | null;
  banco_titular: string | null;
  pago_whatsapp_comprobantes: string | null;
  pago_correo_comprobantes: string | null;
  whatsapp_b2c: string | null;
  whatsapp_b2b: string | null;
  whatsapp_distribuidores: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  linkedin_url: string | null;
  radio_tarjetas: number;
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
}

// Carga y guardado compartidos por las subsecciones de /admin/configuracion
// (General, Métodos de pago, Redes y contacto, Banner principal).
//
// La configuración se partió en varias páginas porque era un único formulario
// de 458 líneas con nueve bloques sin relación entre sí, y había que recorrerlo
// entero para cambiar un número de teléfono.
//
// Cada subsección carga y guarda la FILA COMPLETA, no solo sus campos. Es a
// propósito: así el guardado nunca depende de en qué página estés, y no hay
// forma de que dos secciones se pisen los cambios entre sí.
export function useConfiguracionAdmin() {
  const [config, setConfig] = useState<ConfiguracionSitioAdmin | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    createClient()
      .from("configuracion_sitio")
      .select("*")
      .eq("id", 1)
      .single()
      .then(({ data }) => setConfig(data as ConfiguracionSitioAdmin));
  }, []);

  function actualizar<K extends keyof ConfiguracionSitioAdmin>(
    campo: K,
    valor: ConfiguracionSitioAdmin[K]
  ) {
    setConfig((c) => (c ? { ...c, [campo]: valor } : c));
  }

  async function guardar() {
    if (!config) return;
    setGuardando(true);
    const { error } = await createClient()
      .from("configuracion_sitio")
      .update(config)
      .eq("id", 1);
    setGuardando(false);

    if (error) {
      toast.error(traducirErrorSupabase(error));
      return;
    }

    // El sitio público cachea esta fila; sin esto el cambio no se vería hasta
    // que venciera el TTL. Ver lib/revalidar-publico.ts.
    await revalidarSitioPublico();
    toast.success("Configuración guardada.");
  }

  return { config, actualizar, guardar, guardando, subiendo, setSubiendo };
}
