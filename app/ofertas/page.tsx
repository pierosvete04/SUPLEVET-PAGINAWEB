import type { Metadata } from "next";
import { ProductCard } from "@/components/productos/ProductCard";
import { BannerCarousel } from "@/components/shared/BannerCarousel";
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
    <div className="bg-background pb-section-y">
      <div className="bg-primary py-16 text-center">
        <h1 className="font-display text-4xl font-bold text-primary-foreground md:text-5xl">
          Más Suplevet, mejor precio
        </h1>
        <p className="mx-auto mt-3 max-w-lg font-body text-primary-foreground/90">
          Ahorra comprando combos — misma nutrición funcional, mejor precio por bolsa.
        </p>
      </div>

      <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
        {banners.length > 0 && (
          <div className="mt-10">
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
