import type { Metadata } from "next";
import { ProductCard } from "@/components/productos/ProductCard";
import { BannerCarousel } from "@/components/shared/BannerCarousel";
import { PageBreadcrumbs } from "@/components/shared/PageBreadcrumbs";
import { getCombos } from "@/lib/data/productos";
import { getBannersActivos } from "@/lib/banners";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ofertas y combos Suplevet",
  description:
    "Aprovecha nuestros combos con mejor precio: Combo Mix, 2x150g y 2x250g. Envío gratis en Lima Metropolitana desde S/.150.",
};

export default async function OfertasPage() {
  const combos = await getCombos();
  const banners = await getBannersActivos(await createClient(), "ofertas");

  return (
    <div className="bg-background pb-section-y pt-8 md:pt-10">
      <PageBreadcrumbs items={[{ label: "Ofertas" }]} />
      <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
        {banners.length > 0 && (
          <div>
            <BannerCarousel banners={banners} />
          </div>
        )}
        <div className="mt-12 grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3">
          {combos.map((combo) => (
            <ProductCard key={combo.slug} producto={combo} />
          ))}
        </div>
      </div>
    </div>
  );
}
