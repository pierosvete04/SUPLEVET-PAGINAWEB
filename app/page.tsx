// Placeholder — el Home real (hero de video, combos, showcase, etc.) se
// construye en la Fase 7 siguiendo frontend/01-home.md y las pantallas de Stitch.
// Header/Footer/AnnouncementBar ya viven en app/layout.tsx, no se repiten acá.
export default function Home() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 bg-background px-mobile-margin py-section-y text-center">
      <p className="font-impact text-sky text-lg tracking-wide">
        SUPLEMENTO NUTRICIONAL FUNCIONAL
      </p>
      <h1 className="font-display text-4xl font-bold text-secondary md:text-6xl">
        Tu mascota merece lo mejor por dentro
      </h1>
      <p className="max-w-xl font-body text-muted-foreground">
        Fórmula veterinaria para perros y gatos. Inmunidad, digestión, energía y pelaje en un solo
        producto.
      </p>
      <div className="flex gap-4">
        <button className="rounded-full bg-primary px-6 py-3 font-body font-bold text-primary-foreground">
          Ver productos
        </button>
        <button className="rounded-full border-2 border-secondary px-6 py-3 font-body font-bold text-secondary">
          ¿Cómo funciona?
        </button>
      </div>
    </div>
  );
}
