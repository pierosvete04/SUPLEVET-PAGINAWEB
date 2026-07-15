"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { siteConfig } from "@/lib/site-config";

// Config pública editable desde /admin/configuracion, con fallback a los
// valores estáticos de site-config.ts mientras carga o si el campo está
// vacío en la base — así ningún componente cliente queda nunca sin dato.
export interface ConfiguracionSitioCliente {
  whatsappB2C: string;
  whatsappB2B: string;
  whatsappDistribuidores: string;
  correoContacto: string;
  horarioAtencion: string;
  legalRazonSocial: string;
  legalRuc: string;
  legalDomicilioFiscal: string;
  legalCorreoAtencion: string[];
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  linkedinUrl: string;
}

const DEFAULTS: ConfiguracionSitioCliente = {
  whatsappB2C: siteConfig.whatsappB2C,
  whatsappB2B: siteConfig.whatsappB2B,
  whatsappDistribuidores: siteConfig.whatsappDistribuidores,
  correoContacto: siteConfig.correoContacto,
  horarioAtencion: siteConfig.horarioAtencion,
  legalRazonSocial: siteConfig.legal.razonSocial,
  legalRuc: siteConfig.legal.ruc,
  legalDomicilioFiscal: siteConfig.legal.domicilioFiscal,
  legalCorreoAtencion: [...siteConfig.legal.correoAtencion],
  facebookUrl: siteConfig.redesSociales.facebook,
  instagramUrl: siteConfig.redesSociales.instagram,
  tiktokUrl: siteConfig.redesSociales.tiktok,
  linkedinUrl: siteConfig.redesSociales.linkedin,
};

export function useConfiguracionSitio(): ConfiguracionSitioCliente {
  const [config, setConfig] = useState(DEFAULTS);

  useEffect(() => {
    createClient()
      .from("configuracion_sitio")
      .select(
        "whatsapp_b2c, whatsapp_b2b, whatsapp_distribuidores, correo_contacto, horario_atencion, legal_razon_social, legal_ruc, legal_domicilio_fiscal, legal_correo_atencion, facebook_url, instagram_url, tiktok_url, linkedin_url"
      )
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setConfig({
          whatsappB2C: data.whatsapp_b2c || DEFAULTS.whatsappB2C,
          whatsappB2B: data.whatsapp_b2b || DEFAULTS.whatsappB2B,
          whatsappDistribuidores: data.whatsapp_distribuidores || DEFAULTS.whatsappDistribuidores,
          correoContacto: data.correo_contacto || DEFAULTS.correoContacto,
          horarioAtencion: data.horario_atencion || DEFAULTS.horarioAtencion,
          legalRazonSocial: data.legal_razon_social || DEFAULTS.legalRazonSocial,
          legalRuc: data.legal_ruc || DEFAULTS.legalRuc,
          legalDomicilioFiscal: data.legal_domicilio_fiscal || DEFAULTS.legalDomicilioFiscal,
          legalCorreoAtencion: data.legal_correo_atencion
            ? data.legal_correo_atencion.split(",").map((c: string) => c.trim())
            : DEFAULTS.legalCorreoAtencion,
          facebookUrl: data.facebook_url || DEFAULTS.facebookUrl,
          instagramUrl: data.instagram_url || DEFAULTS.instagramUrl,
          tiktokUrl: data.tiktok_url || DEFAULTS.tiktokUrl,
          linkedinUrl: data.linkedin_url || DEFAULTS.linkedinUrl,
        });
      });
  }, []);

  return config;
}
