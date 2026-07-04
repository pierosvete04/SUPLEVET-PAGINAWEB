"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  linkedin_url: string | null;
}

function Campo({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
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

  async function guardar() {
    if (!config) return;
    setGuardando(true);
    await createClient().from("configuracion_sitio").update(config).eq("id", 1);
    setGuardando(false);
    setGuardado(true);
  }

  if (!config) return <p className="text-sm text-muted-foreground">Cargando…</p>;

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
