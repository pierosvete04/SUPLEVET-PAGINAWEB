import Image from "next/image";
import { ProductCard } from "@/components/productos/ProductCard";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { PresentacionesSlider } from "@/components/home/PresentacionesSlider";
import { getPresentaciones } from "@/lib/data/productos";
import { getBannersHome } from "@/lib/banners";
import { createClient } from "@/lib/supabase/server";

// Foto real ya usada en el Hero (lifestyle-perro.jpg) — fallback cuando aún
// no se configuraron imágenes del slider desde el panel admin (Banners).
const HERO_IMG_FALLBACK =
  "https://bcahhdszzwearqaafhpa.supabase.co/storage/v1/object/public/productos-web-fotos/suplevet-150g/lifestyle-perro.jpg";

export async function PresentacionesShowcase() {
  const [{ g150, g250 }, imagenesSlider] = await Promise.all([
    getPresentaciones(),
    getBannersHome(await createClient()),
  ]);
  const items = [g150, g250].filter((p): p is NonNullable<typeof p> => p !== null);

  if (items.length === 0) return null;

  return (
    <section className="bg-white pb-section-y pt-16 md:pt-20">
      <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
        <h2 className="text-center font-display text-3xl font-bold text-secondary md:text-4xl">
          Nuevas presentaciones
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-gutter md:grid-cols-[1.1fr_1fr] md:items-stretch">
          {imagenesSlider.length > 0 ? (
            <PresentacionesSlider imagenes={imagenesSlider} />
          ) : (
            <div className="relative hidden overflow-hidden rounded-[var(--radius-card)] md:block">
              <Image src={HERO_IMG_FALLBACK} alt="" fill className="object-cover" sizes="45vw" />
            </div>
          )}

          {/* Mobile: scroll horizontal de una tarjeta grande a la vez — mismo
              patrón (sin trucos de margen negativo) que "Cómo se prepara":
              al ser hijo directo del contenedor con px-mobile-margin, la
              primera tarjeta ya arranca alineada con el margen de página,
              igual que el título de arriba. Desde md pasa a grid de 2 columnas. */}
          <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:pb-0">
            {items.map((p, i) => (
              <ScrollReveal
                key={p.slug}
                delay={i * 0.1}
                className="w-[78%] shrink-0 snap-start sm:w-64 md:w-auto"
              >
                <ProductCard producto={p} ctaLabel="Comprar ahora" />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
