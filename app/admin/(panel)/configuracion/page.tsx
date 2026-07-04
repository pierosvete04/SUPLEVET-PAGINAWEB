"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

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
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm text-secondary"
      />
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

  if (!config) return <p className="font-body text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 font-body text-xl font-bold text-secondary">Configuración</h1>

      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="mb-4 font-body text-sm font-bold uppercase text-muted-foreground">
            Barra de anuncios
          </h2>
          <label className="mb-3 flex items-center gap-2 font-body text-sm text-secondary">
            <input
              type="checkbox"
              checked={config.announcement_bar_activo}
              onChange={(e) => actualizar("announcement_bar_activo", e.target.checked)}
            />
            Mostrar barra de anuncios
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo
              label="Texto"
              value={config.announcement_bar_texto ?? ""}
              onChange={(v) => actualizar("announcement_bar_texto", v)}
            />
            <Campo
              label="Link (opcional)"
              value={config.announcement_bar_link ?? ""}
              onChange={(v) => actualizar("announcement_bar_link", v)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="mb-4 font-body text-sm font-bold uppercase text-muted-foreground">
            Yape / Plin (pago manual en checkout)
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo
              label="Número"
              value={config.yape_plin_numero ?? ""}
              onChange={(v) => actualizar("yape_plin_numero", v)}
            />
            <Campo
              label="Titular"
              value={config.yape_plin_titular ?? ""}
              onChange={(v) => actualizar("yape_plin_titular", v)}
            />
          </div>
          <div className="mt-3">
            <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
              QR
            </label>
            <input
              type="file"
              accept="image/*"
              disabled={subiendo}
              onChange={(e) => e.target.files?.[0] && subirQr(e.target.files[0])}
              className="font-body text-sm"
            />
            {config.yape_plin_qr_url && (
              <div className="relative mt-2 h-24 w-24 overflow-hidden rounded-lg border border-border">
                <Image src={config.yape_plin_qr_url} alt="QR" fill className="object-contain" />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="mb-4 font-body text-sm font-bold uppercase text-muted-foreground">
            Cuenta bancaria (transferencia)
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo
              label="Banco"
              value={config.banco_nombre ?? ""}
              onChange={(v) => actualizar("banco_nombre", v)}
            />
            <Campo
              label="Titular"
              value={config.banco_titular ?? ""}
              onChange={(v) => actualizar("banco_titular", v)}
            />
            <Campo
              label="N° de cuenta"
              value={config.banco_cuenta ?? ""}
              onChange={(v) => actualizar("banco_cuenta", v)}
            />
            <Campo label="CCI" value={config.banco_cci ?? ""} onChange={(v) => actualizar("banco_cci", v)} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="mb-4 font-body text-sm font-bold uppercase text-muted-foreground">
            WhatsApp
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo
              label="B2C (clientes)"
              value={config.whatsapp_b2c ?? ""}
              onChange={(v) => actualizar("whatsapp_b2c", v)}
            />
            <Campo
              label="B2B (veterinarias)"
              value={config.whatsapp_b2b ?? ""}
              onChange={(v) => actualizar("whatsapp_b2b", v)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="mb-4 font-body text-sm font-bold uppercase text-muted-foreground">
            Redes sociales
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo
              label="Facebook"
              value={config.facebook_url ?? ""}
              onChange={(v) => actualizar("facebook_url", v)}
            />
            <Campo
              label="Instagram"
              value={config.instagram_url ?? ""}
              onChange={(v) => actualizar("instagram_url", v)}
            />
            <Campo
              label="TikTok"
              value={config.tiktok_url ?? ""}
              onChange={(v) => actualizar("tiktok_url", v)}
            />
            <Campo
              label="LinkedIn"
              value={config.linkedin_url ?? ""}
              onChange={(v) => actualizar("linkedin_url", v)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={guardar}
            disabled={guardando || subiendo}
            className="w-fit rounded-full bg-primary px-6 py-2.5 font-body font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
          {guardado && <span className="font-body text-sm text-green-600">Guardado ✓</span>}
        </div>
      </div>
    </div>
  );
}
