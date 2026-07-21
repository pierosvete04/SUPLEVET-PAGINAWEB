import { ProductCard } from "@/components/productos/ProductCard";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { getCombos } from "@/lib/data/productos";

export async function CombosDestacados() {
  const combos = await getCombos();

  return (
    <section id="combos" className="scroll-mt-24 bg-white pb-7 pt-9">
      <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
        <h2 className="text-center font-display text-3xl font-bold text-secondary md:text-4xl">
          ¡Mira nuestros combos! 😁
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3">
          {combos.map((combo, i) => (
            <ScrollReveal key={combo.slug} delay={i * 0.1}>
              <ProductCard producto={combo} ctaLabel="Comprar ahora" />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
