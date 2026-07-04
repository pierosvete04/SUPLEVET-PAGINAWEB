import Image from "next/image";

// Placeholder de Fase 0 — confirma que Next.js, Tailwind y los tokens de marca
// funcionan correctamente. El diseño real del Home (basado en los prompts de
// frontend/01-home.md y las pantallas de Stitch) se construye en la Fase 7.
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-mobile-margin text-center">
      <Image
        src="/logos/logo-color-horizontal.png"
        alt="Suplevet"
        width={280}
        height={60}
        priority
      />
      <p className="font-impact text-sky text-lg tracking-wide">
        SUPLEMENTO NUTRICIONAL FUNCIONAL
      </p>
      <h1 className="font-display text-4xl font-bold text-secondary md:text-6xl">
        Tu mascota merece lo mejor por dentro
      </h1>
      <p className="max-w-xl font-body text-muted-foreground">
        Setup de Next.js + Tailwind + tokens de marca — Fase 0 completa.
      </p>
      <div className="flex gap-4">
        <button className="rounded-full bg-primary px-6 py-3 font-body font-bold text-primary-foreground">
          Ver productos
        </button>
        <button className="rounded-full border-2 border-secondary px-6 py-3 font-body font-bold text-secondary">
          ¿Cómo funciona?
        </button>
      </div>
    </main>
  );
}
