import { createClient } from "@/lib/supabase/server";
import { agruparVariantesPorDiseno, getVariantesActivas } from "@/lib/regalo-variantes";
import { BandanaShowcaseCard } from "@/components/home/BandanaShowcaseCard";

// Sección de marketing para el regalo "cualquier combo = bandana gratis" —
// puramente informativa (la elección real de diseño+talla ocurre en el
// carrito/checkout, una vez que hay un combo adentro). Se oculta sola si el
// regalo de categoría "combo" no está activo (ej. si el admin lo desactiva o
// cambia la promo a otra condición).
export async function BandanaShowcase() {
  const supabase = await createClient();
  const { data: regalo } = await supabase
    .from("regalos")
    .select("*")
    .eq("activo", true)
    .eq("condicion_tipo", "categoria")
    .eq("condicion_categoria", "combo")
    .maybeSingle();

  if (!regalo) return null;

  const variantes = await getVariantesActivas(supabase, regalo.id);
  const disenos = agruparVariantesPorDiseno(variantes);
  if (disenos.length === 0) return null;

  return (
    <section className="bg-soft-gray py-9">
      <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
        <h2 className="text-center font-display text-3xl font-bold text-secondary md:text-4xl">
          🎁 Compra un combo y llévate una bandana de regalo
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center font-body text-sm text-muted-foreground">
          Escoge entre estos 4 diseños y la talla de tu bandana.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-gutter md:grid-cols-4">
          {disenos.map((diseno) => (
            <BandanaShowcaseCard key={diseno.nombre} diseno={diseno} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <a
            href="#combos"
            className="inline-block rounded-[17px] bg-primary px-6 py-3 font-body font-bold text-primary-foreground hover:opacity-90"
          >
            Ver combos
          </a>
        </div>
      </div>
    </section>
  );
}
