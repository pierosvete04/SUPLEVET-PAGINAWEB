import Image from "next/image";
import { getPresentaciones } from "@/lib/data/productos";

export async function PresentacionesShowcase() {
  const presentaciones = await getPresentaciones();
  const items = [presentaciones.g150, presentaciones.g250].filter(
    (p): p is { nombre: string; imagen: string } => p !== null
  );

  return (
    <section className="bg-secondary pb-section-y">
      <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
        <h2 className="text-center font-display text-3xl font-bold text-white md:text-4xl">
          Nuevas presentaciones
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-gutter sm:grid-cols-2">
          {items.map((p) => (
            <div key={p.nombre} className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <Image
                src={p.imagen}
                alt={p.nombre}
                fill
                className="object-cover"
                sizes="(min-width: 640px) 50vw, 100vw"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
