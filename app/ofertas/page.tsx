import type { Metadata } from "next";
import { ProductCard } from "@/components/productos/ProductCard";
import { BannerCarousel } from "@/components/shared/BannerCarousel";
import { PageBreadcrumbs } from "@/components/shared/PageBreadcrumbs";
import { getBannersOfertas, getProductosPublicos } from "@/lib/data/publico";
import { medirImagenes } from "@/lib/image-size";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Ofertas y combos Suplevet",
  description:
    "Aprovecha nuestros combos con mejor precio: Combo Mix, 2x150g y 2x250g. Envío gratis en Lima Metropolitana desde S/.170.",
  alternates: { canonical: `${siteConfig.siteUrl}/ofertas` },
};

export const revalidate = 60;

export default async function OfertasPage() {
  // getProductosPublicos + filtrado local en vez de getCombos(): así el catálogo
  // se lee UNA vez y la caché se comparte con /productos y la home, en lugar de
  // que cada página guarde su propia copia de la misma tabla.
  const [productos, banners] = await Promise.all([getProductosPublicos(), getBannersOfertas()]);
  const combos = productos.filter((p) => p.categoria === "combo");
  const dimensiones = await medirImagenes(banners.flatMap((b) => [b.imagen, b.imagen_mobile]));

  return (
    <div className="bg-background pb-section-y">
      <PageBreadcrumbs items={[{ label: "Ofertas" }]} />
      <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
        {banners.length > 0 && (
          <div className="mt-6">
            <BannerCarousel banners={banners} dimensiones={dimensiones} />
          </div>
        )}
        <h1 className="mt-10 text-center font-display text-4xl font-bold text-secondary md:text-5xl">
          Ofertas y combos
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-center font-body text-muted-foreground">
          Aprovecha nuestros combos con mejor precio y envío gratis en Lima Metropolitana desde
          S/.170.
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
