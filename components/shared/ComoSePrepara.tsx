import { PackageOpen, Scale, UtensilsCrossed, PartyPopper } from "lucide-react";
import { HillCurve } from "@/components/ui/HillCurve";

// Referencia visual: bloque "Swap Your Top For A New Look" de PopSockets
// (PLAN.md sección 5.2). Pendiente operativo: reemplazar los íconos por los
// 4 GIFs en loop reales cuando se produzcan (sección 15).
const pasos = [
  { icon: PackageOpen, numero: 1, texto: "Abre el sobre" },
  { icon: Scale, numero: 2, texto: "Mide la porción según el peso de tu mascota" },
  { icon: UtensilsCrossed, numero: 3, texto: "Mezcla con su alimento o disuelve en agua tibia" },
  { icon: PartyPopper, numero: 4, texto: "¡Listo, a disfrutar!" },
];

interface ComoSePreparaProps {
  /** true = ya viene precedida de una sección de fondo blanco (agrega la curva) */
  conCurvaSuperior?: boolean;
}

export function ComoSePrepara({ conCurvaSuperior = false }: ComoSePreparaProps) {
  return (
    <>
      {conCurvaSuperior && <HillCurve fillClassName="fill-secondary" bgClassName="bg-white" />}
      <section id="como-se-prepara" className="bg-secondary py-section-y">
        <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
          <h2 className="text-center font-display text-3xl font-bold text-white md:text-4xl">
            ¿Cómo se prepara?
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-gutter">
            {pasos.map(({ icon: Icon, numero, texto }) => (
              <div
                key={numero}
                className="flex flex-col items-center gap-3 rounded-xl bg-white/5 p-6 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-secondary">
                  <Icon className="h-8 w-8" strokeWidth={1.5} />
                </div>
                <span className="font-impact text-sky text-sm">PASO {numero}</span>
                <p className="font-body text-sm text-white">{texto}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <a
              href="/productos"
              className="inline-block rounded-full bg-primary px-6 py-3 font-body font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Comprar ahora
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
