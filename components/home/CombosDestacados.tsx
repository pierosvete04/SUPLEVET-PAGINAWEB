import { HillCurve } from "@/components/ui/HillCurve";
import { ProductCard } from "@/components/productos/ProductCard";
import { combos } from "@/lib/data/productos-temp";

export function CombosDestacados() {
  return (
    <>
      <HillCurve fillClassName="fill-secondary" bgClassName="bg-white" />
      <section className="bg-secondary py-section-y">
        <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
          <h2 className="text-center font-display text-3xl font-bold text-white md:text-4xl">
            ¡Mira nuestros combos! 😁
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3">
            {combos.map((combo) => (
              <ProductCard key={combo.slug} producto={combo} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
