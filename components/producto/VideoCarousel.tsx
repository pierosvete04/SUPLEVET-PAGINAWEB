import { Play } from "lucide-react";
import { HillCurve } from "@/components/ui/HillCurve";

// Pendiente operativo: reemplazar por los videos reales (testimonios, uso del
// producto) cuando estén grabados — mismo patrón que TikTok/Nike (PLAN.md 5.4).
const videosPendientes = [1, 2, 3, 4];

export function VideoCarousel() {
  return (
    <>
      <HillCurve fillClassName="fill-secondary" bgClassName="bg-white" />
      <section className="bg-secondary py-section-y">
        <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
          <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
            Mira a Suplevet en acción
          </h2>
          <div className="mt-8 flex gap-4 overflow-x-auto pb-4">
            {videosPendientes.map((n) => (
              <div
                key={n}
                className="flex aspect-[9/16] w-48 shrink-0 flex-col items-center justify-center gap-2 rounded-xl bg-white/10 text-white/60"
              >
                <Play className="h-10 w-10" strokeWidth={1.5} />
                <span className="font-body text-xs">Video pendiente</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
