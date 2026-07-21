import type { Metadata } from "next";
import { ProductCard } from "@/components/productos/ProductCard";
import { BannerCarousel } from "@/components/shared/BannerCarousel";
import { PageBreadcrumbs } from "@/components/shared/PageBreadcrumbs";
import { getCombos } from "@/lib/data/productos";
import { getBannersActivos } from "@/lib/banners";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Ofertas y combos Suplevet",
  description:
    "Aprovecha nuestros combos con mejor precio: Combo Mix, 2x150g y 2x250g. Envío gratis en Lima Metropolitana desde S/.150.",
  alternates: { canonical: `${siteConfig.siteUrl}/ofertas` },
};

export default async function OfertasPage() {
  const combos = await getCombos();
  const banners = await getBannersActivos(await createClient(), "ofertas");

  return (
    <div className="bg-background pb-section-y">
      <PageBreadcrumbs items={[{ label: "Ofertas" }]} />
      <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
        {banners.length > 0 && (
          <div className="mt-6">
            <BannerCarousel banners={banners} />
          </div>
        )}
        <h1 className="mt-10 text-center font-display text-4xl font-bold text-secondary md:text-5xl">
          Ofertas y combos
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-center font-body text-muted-foreground">
          Aprovecha nuestros combos con mejor precio y envío gratis en Lima Metropolitana desde
          S/.150.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3">
          {combos.map((combo) => (
            <ProductCard key={combo.slug} producto={combo} />
          ))}
        </div>
      </div>
    </div>
  );
}
