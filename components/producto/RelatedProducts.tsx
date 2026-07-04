import { ProductCard } from "@/components/productos/ProductCard";
import { getProductos } from "@/lib/data/productos";

interface RelatedProductsProps {
  slugActual: string;
}

export async function RelatedProducts({ slugActual }: RelatedProductsProps) {
  const productos = await getProductos();
  const relacionados = productos.filter((p) => p.slug !== slugActual).slice(0, 3);

  return (
    <section className="bg-soft-gray py-section-y">
      <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
        <h2 className="text-center font-display text-2xl font-bold text-secondary md:text-3xl">
          También te puede gustar
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3">
          {relacionados.map((producto) => (
            <ProductCard key={producto.slug} producto={producto} />
          ))}
        </div>
      </div>
    </section>
  );
}
