import Image from "next/image";

// Pendiente operativo (PLAN.md sección 15 / 5.2): el video real todavía no
// existe (cámara apoyada en el piso, la mascota mira hacia el lente desde
// arriba). Mientras tanto se usa una foto real de producto como fondo —
// cuando lleguen los videos (desktop 16:9 / mobile 9:16), se reemplaza el
// <Image> de abajo por un <video autoPlay muted loop playsInline>.
const HERO_FALLBACK_IMG =
  "https://bcahhdszzwearqaafhpa.supabase.co/storage/v1/object/public/productos-web-fotos/suplevet-150g/lifestyle-perro.jpg";

export function Hero() {
  return (
    <section className="relative flex min-h-[85vh] items-center overflow-hidden bg-secondary">
      <Image
        src={HERO_FALLBACK_IMG}
        alt=""
        fill
        priority
        className="object-cover opacity-70"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/40 to-transparent" />

      <div className="relative mx-auto w-full max-w-container px-mobile-margin md:px-gutter">
        <div className="max-w-xl">
          <p className="font-impact text-sky text-lg tracking-wide">
            SUPLEMENTO NUTRICIONAL FUNCIONAL
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold text-white md:text-6xl">
            Tu mascota merece lo mejor por dentro
          </h1>
          <p className="mt-4 font-body text-base text-white/85 md:text-lg">
            Fórmula veterinaria para perros y gatos. Inmunidad, digestión, energía y pelaje en un
            solo producto.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="/productos"
              className="rounded-full bg-primary px-6 py-3 text-center font-body font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Ver productos
            </a>
            <a
              href="#como-se-prepara"
              className="rounded-full border-2 border-white px-6 py-3 text-center font-body font-bold text-white transition-colors hover:bg-white hover:text-secondary"
            >
              ¿Cómo funciona?
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
