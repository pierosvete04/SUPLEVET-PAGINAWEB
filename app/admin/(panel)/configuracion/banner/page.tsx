"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { uploadFileToR2 } from "@/lib/uploadToR2";
import { ConfiguracionSeccion } from "@/components/admin/configuracion/ConfiguracionSeccion";
import {
  useConfiguracionAdmin,
  type ConfiguracionSitioAdmin,
} from "@/components/admin/configuracion/useConfiguracionAdmin";

export default function ConfiguracionBannerPage() {
  const { config, actualizar, guardar, guardando, subiendo, setSubiendo } = useConfiguracionAdmin();

  async function subirBanner(
    campo: Extract<keyof ConfiguracionSitioAdmin, "hero_banner_desktop" | "hero_banner_mobile">,
    file: File
  ) {
    setSubiendo(true);
    const url = await uploadFileToR2("productos-web-fotos", file, "hero");
    if (url) actualizar(campo, url);
    setSubiendo(false);
  }

  if (!config) return <BrandedLoader />;

  return (
    <ConfiguracionSeccion
      titulo="Banner principal"
      descripcion="La imagen grande de la página de Inicio."
      guardando={guardando || subiendo}
      onGuardar={guardar}
    >
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
    </ConfiguracionSeccion>
  );
}
