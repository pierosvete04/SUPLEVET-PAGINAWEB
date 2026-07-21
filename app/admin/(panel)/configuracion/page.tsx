"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BrandedLoader } from "@/components/ui/branded-loader";

interface ConfiguracionSitio {
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

function Campo({
  id,
  label,
  value,
  onChange,
  textarea = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {textarea ? (
        <Textarea id={id} rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

export default function AdminConfiguracionPage() {
  const [config, setConfig] = useState<ConfiguracionSitio | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    createClient()
      .from("configuracion_sitio")
      .select("*")
      .eq("id", 1)
      .single()
      .then(({ data }) => setConfig(data as ConfiguracionSitio));
  }, []);

  function actualizar<K extends keyof ConfiguracionSitio>(campo: K, valor: ConfiguracionSitio[K]) {
    setConfig((c) => (c ? { ...c, [campo]: valor } : c));
    setGuardado(false);
  }

  async function subirQr(file: File) {
    setSubiendo(true);
    const supabase = createClient();
    const path = `configuracion/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("productos-web-fotos").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("productos-web-fotos").getPublicUrl(path);
      actualizar("yape_plin_qr_url", data.publicUrl);
    }
    setSubiendo(false);
  }

  async function subirBanner(campo: "hero_banner_desktop" | "hero_banner_mobile", file: File) {
    setSubiendo(true);
    const supabase = createClient();
    const path = `hero/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("productos-web-fotos").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("productos-web-fotos").getPublicUrl(path);
      actualizar(campo, data.publicUrl);
    }
    setSubiendo(false);
  }

  async function guardar() {
    if (!config) return;
    setGuardando(true);
    await createClient().from("configuracion_sitio").update(config).eq("id", 1);
    setGuardando(false);
    setGuardado(true);
  }

  if (!config) return <BrandedLoader />;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h2 className="text-lg font-semibold">Configuración</h2>

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
          <CardTitle className="text-sm text-muted-foreground">
            Yape / Plin (pago manual en checkout)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo
              id="yp-numero"
              label="Número"
              value={config.yape_plin_numero ?? ""}
              onChange={(v) => actualizar("yape_plin_numero", v)}
            />
            <Campo
              id="yp-titular"
              label="Titular"
              value={config.yape_plin_titular ?? ""}
              onChange={(v) => actualizar("yape_plin_titular", v)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="yp-qr">QR</Label>
            <Input
              id="yp-qr"
              type="file"
              accept="image/*"
              disabled={subiendo}
              onChange={(e) => e.target.files?.[0] && subirQr(e.target.files[0])}
            />
            {config.yape_plin_qr_url && (
              <div className="relative mt-1 h-24 w-24 overflow-hidden rounded-lg border">
                <Image src={config.yape_plin_qr_url} alt="QR" fill className="object-contain" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Cuenta bancaria (transferencia)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo
            id="banco-nombre"
            label="Banco"
            value={config.banco_nombre ?? ""}
            onChange={(v) => actualizar("banco_nombre", v)}
          />
          <Campo
            id="banco-titular"
            label="Titular"
            value={config.banco_titular ?? ""}
            onChange={(v) => actualizar("banco_titular", v)}
          />
          <Campo
            id="banco-cuenta"
            label="N° de cuenta"
            value={config.banco_cuenta ?? ""}
            onChange={(v) => actualizar("banco_cuenta", v)}
          />
          <Campo
            id="banco-cci"
            label="CCI"
            value={config.banco_cci ?? ""}
            onChange={(v) => actualizar("banco_cci", v)}
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
          <CardTitle className="text-sm text-muted-foreground">Banner principal (Hero)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="hero-banner-desktop">Banner escritorio (16:9)</Label>
            <Input
              id="hero-banner-desktop"
              type="file"
              accept="image/*"
              disabled={subiendo}
              onChange={(e) =>
                e.target.files?.[0] && subirBanner("hero_banner_desktop", e.target.files[0])
              }
            />
            {config.hero_banner_desktop && (
              <div className="relative mt-1 aspect-video w-full max-w-sm overflow-hidden rounded-md border">
                <Image
                  src={config.hero_banner_desktop}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="384px"
                />
              </div>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="hero-banner-mobile">Banner mobile (9:16)</Label>
            <Input
              id="hero-banner-mobile"
              type="file"
              accept="image/*"
              disabled={subiendo}
              onChange={(e) =>
                e.target.files?.[0] && subirBanner("hero_banner_mobile", e.target.files[0])
              }
            />
            {config.hero_banner_mobile && (
              <div className="relative mt-1 aspect-[9/16] w-full max-w-[160px] overflow-hidden rounded-md border">
                <Image
                  src={config.hero_banner_mobile}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="160px"
                />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            El banner es la imagen principal de Inicio y enlaza a la sección de combos. Si no subes un
            banner mobile, en celulares se muestra el mismo banner de escritorio. Este banner solo se
            usa si no hay banners activos con página &quot;Banner principal (Hero)&quot; en{" "}
            <span className="font-medium">Contenido → Banners</span>; si configuras uno o más ahí, se
            muestran esos en su lugar (con slide automático si hay más de uno).
          </p>
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

      <div className="flex items-center gap-3">
        <Button onClick={guardar} disabled={guardando || subiendo}>
          {guardando ? "Guardando…" : "Guardar cambios"}
        </Button>
        {guardado && <span className="text-sm text-green-600">Guardado ✓</span>}
      </div>
    </div>
  );
}
