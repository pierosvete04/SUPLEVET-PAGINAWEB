"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { Campo, ConfiguracionSeccion } from "@/components/admin/configuracion/ConfiguracionSeccion";
import { useConfiguracionAdmin } from "@/components/admin/configuracion/useConfiguracionAdmin";

// Redes sociales y los tres WhatsApp del sitio. Van juntos porque son lo mismo:
// los canales por los que alguien contacta con la marca.
export default function ConfiguracionRedesPage() {
  const { config, actualizar, guardar, guardando } = useConfiguracionAdmin();

  if (!config) return <BrandedLoader />;

  return (
    <ConfiguracionSeccion
      titulo="Redes y contacto"
      descripcion="Enlaces de redes sociales y los números de WhatsApp que usa el sitio."
      guardando={guardando}
      onGuardar={guardar}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Redes sociales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo
            id="rs-facebook"
            label="Facebook"
            value={config.facebook_url ?? ""}
            onChange={(v) => actualizar("facebook_url", v)}
          />
          <Campo
            id="rs-instagram"
            label="Instagram"
            value={config.instagram_url ?? ""}
            onChange={(v) => actualizar("instagram_url", v)}
          />
          <Campo
            id="rs-tiktok"
            label="TikTok"
            value={config.tiktok_url ?? ""}
            onChange={(v) => actualizar("tiktok_url", v)}
          />
          <Campo
            id="rs-linkedin"
            label="LinkedIn"
            value={config.linkedin_url ?? ""}
            onChange={(v) => actualizar("linkedin_url", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo
            id="wa-b2c"
            label="B2C (clientes)"
            value={config.whatsapp_b2c ?? ""}
            onChange={(v) => actualizar("whatsapp_b2c", v)}
          />
          <Campo
            id="wa-b2b"
            label="B2B (veterinarias)"
            value={config.whatsapp_b2b ?? ""}
            onChange={(v) => actualizar("whatsapp_b2b", v)}
          />
          <Campo
            id="wa-distribuidores"
            label="Distribuidores (Oportunidad de negocio)"
            value={config.whatsapp_distribuidores ?? ""}
            onChange={(v) => actualizar("whatsapp_distribuidores", v)}
          />
        </CardContent>
      </Card>
    </ConfiguracionSeccion>
  );
}
