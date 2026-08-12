"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { Campo, ConfiguracionSeccion } from "@/components/admin/configuracion/ConfiguracionSeccion";
import { useConfiguracionAdmin } from "@/components/admin/configuracion/useConfiguracionAdmin";

// Ajustes generales del sitio. Los bloques de pagos, redes/contacto y banner
// viven en sus propias subsecciones del menú — esta página era un formulario
// único de 458 líneas donde había que bajar por nueve bloques sin relación
// entre sí para cambiar un dato.
export default function ConfiguracionGeneralPage() {
  const { config, actualizar, guardar, guardando } = useConfiguracionAdmin();

  if (!config) return <BrandedLoader />;

  return (
    <ConfiguracionSeccion
      titulo="Configuración general"
      descripcion="Barra de anuncios, datos legales, barra de confianza y diseño."
      guardando={guardando}
      onGuardar={guardar}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Barra de anuncios</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={config.announcement_bar_activo}
              onCheckedChange={(checked) => actualizar("announcement_bar_activo", checked === true)}
            />
            Mostrar barra de anuncios
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo
              id="ab-texto"
              label="Texto"
              value={config.announcement_bar_texto ?? ""}
              onChange={(v) => actualizar("announcement_bar_texto", v)}
            />
            <Campo
              id="ab-link"
              label="Link (opcional)"
              value={config.announcement_bar_link ?? ""}
              onChange={(v) => actualizar("announcement_bar_link", v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Legal y datos de contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo
            id="legal-razon"
            label="Razón social"
            value={config.legal_razon_social ?? ""}
            onChange={(v) => actualizar("legal_razon_social", v)}
          />
          <Campo
            id="legal-ruc"
            label="RUC"
            value={config.legal_ruc ?? ""}
            onChange={(v) => actualizar("legal_ruc", v)}
          />
          <Campo
            id="legal-domicilio"
            label="Domicilio fiscal"
            value={config.legal_domicilio_fiscal ?? ""}
            onChange={(v) => actualizar("legal_domicilio_fiscal", v)}
          />
          <Campo
            id="legal-correo-atencion"
            label="Correos de atención (separados por coma)"
            value={config.legal_correo_atencion ?? ""}
            onChange={(v) => actualizar("legal_correo_atencion", v)}
          />
          <Campo
            id="correo-contacto"
            label="Correo de contacto (página Contáctanos)"
            value={config.correo_contacto ?? ""}
            onChange={(v) => actualizar("correo_contacto", v)}
          />
          <Campo
            id="horario-atencion"
            label="Horario de atención"
            value={config.horario_atencion ?? ""}
            onChange={(v) => actualizar("horario_atencion", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            Barra de confianza (debajo del Hero)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Campo
            id="trustbar-1"
            label="Texto 1"
            value={config.trustbar_texto_1 ?? ""}
            onChange={(v) => actualizar("trustbar_texto_1", v)}
          />
          <Campo
            id="trustbar-2"
            label="Texto 2"
            value={config.trustbar_texto_2 ?? ""}
            onChange={(v) => actualizar("trustbar_texto_2", v)}
          />
          <Campo
            id="trustbar-3"
            label="Texto 3"
            value={config.trustbar_texto_3 ?? ""}
            onChange={(v) => actualizar("trustbar_texto_3", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Diseño</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Label htmlFor="radio-tarjetas">
            Radio de bordes de tarjetas/recuadros ({config.radio_tarjetas}px)
          </Label>
          <input
            id="radio-tarjetas"
            type="range"
            min={0}
            max={32}
            step={1}
            value={config.radio_tarjetas}
            onChange={(e) => actualizar("radio_tarjetas", Number(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Estandariza las esquinas de todas las tarjetas de producto, recuadros de contacto y
            banners informativos del sitio. Los botones tipo píldora no se ven afectados.
          </p>
          <div
            className="h-16 w-32 border-2 border-dashed border-accent bg-accent/10"
            style={{ borderRadius: `${config.radio_tarjetas}px` }}
          />
        </CardContent>
      </Card>
    </ConfiguracionSeccion>
  );
}
