import type { Metadata } from "next";
import Image from "next/image";
import { Beaker, Heart, Lightbulb, Play } from "lucide-react";
import { HillCurve } from "@/components/ui/HillCurve";

export const metadata: Metadata = {
  title: "Quiénes somos — Suplevet",
  description:
    "Conoce la historia, misión y valores de Suplevet, marca peruana de nutrición clínica veterinaria desarrollada por Nutrova for Pets.",
};

const valores = [
  {
    icon: Beaker,
    titulo: "Calidad y Ciencia",
    texto:
      "Cada ingrediente está respaldado por estudios clínicos. Ingredientes de grado farmacéutico o alimenticio, sin aditivos nocivos, sin gluten ni azúcar añadida.",
  },
  {
    icon: Heart,
    titulo: "Compromiso con el Bienestar Animal",
    texto:
      "Las mascotas son familia. Todo lo que hacemos gira en torno a mejorar su calidad de vida.",
  },
  {
    icon: Lightbulb,
    titulo: "Innovación Constante",
    texto:
      "Fórmula única en Perú que combina nutrición funcional con enfoque clínico, respaldada por investigación.",
  },
];

const HERO_IMG =
  "https://bcahhdszzwearqaafhpa.supabase.co/storage/v1/object/public/productos-web-fotos/suplevet-250g/lifestyle-gato.png";

export default function NosotrosPage() {
  return (
    <div>
      <section className="relative flex min-h-[50vh] items-center justify-center overflow-hidden bg-secondary text-center">
        <Image src={HERO_IMG} alt="" fill className="object-cover opacity-40" sizes="100vw" />
        <div className="absolute inset-0 bg-secondary/60" />
        <div className="relative mx-auto max-w-2xl px-mobile-margin">
          <p className="font-impact text-sky text-sm tracking-wide">SOBRE NOSOTROS</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white md:text-5xl">
            Nutrición funcional para fortalecer la salud de las mascotas desde adentro
          </h1>
        </div>
      </section>

      <section className="bg-white py-10 text-center">
        <p className="mx-auto max-w-xl px-mobile-margin font-display text-xl font-bold text-secondary md:text-2xl">
          &ldquo;El amor por las mascotas nos trajo hasta aquí, y nos llevará más allá&rdquo;
        </p>
      </section>

      <HillCurve fillClassName="fill-secondary" bgClassName="bg-white" />
      <section className="bg-secondary py-section-y">
        <div className="mx-auto max-w-2xl px-mobile-margin text-center md:px-gutter">
          <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
            ¿Quiénes somos?
          </h2>
          <p className="mt-4 font-body text-white/85">
            Suplevet es un suplemento de nutrición funcional hiperproteico diseñado para proteger
            la salud de perros y gatos desde adentro, actuando sobre los sistemas clave del
            organismo: inmune, digestivo y metabólico. Su formulación combina ingredientes
            bioactivos con respaldo científico que no solo aportan nutrientes, sino que cumplen
            funciones específicas en el organismo.
          </p>
          <p className="mt-4 font-body text-white/85">
            Más que un suplemento tradicional, Suplevet se posiciona como una herramienta
            nutricional estratégica que acompaña procesos clínicos, recuperación y mantenimiento de
            la salud — una fórmula innovadora y única en el mercado peruano.
          </p>
        </div>
      </section>

      <section className="bg-primary py-16 text-center">
        <div className="mx-auto max-w-2xl px-mobile-margin">
          <p className="font-impact text-sm tracking-wide text-white/80">MISIÓN</p>
          <p className="mt-3 font-display text-xl font-bold text-white md:text-2xl">
            Desarrollar y ofrecer suplementos nutricionales de alta calidad que contribuyan a la
            salud, recuperación y bienestar integral de las mascotas, respaldados por evidencia
            científica y adaptados a las necesidades reales del entorno veterinario.
          </p>
        </div>
      </section>

      <section className="bg-accent py-16 text-center">
        <div className="mx-auto max-w-2xl px-mobile-margin">
          <p className="font-impact text-sm tracking-wide text-secondary/70">VISIÓN</p>
          <p className="mt-3 font-display text-xl font-bold text-secondary md:text-2xl">
            Ser una marca referente en nutrición clínica para mascotas en el mercado, reconocida
            por su innovación, efectividad y respaldo profesional, consolidando una red sólida
            entre veterinarios y dueños de mascotas.
          </p>
        </div>
      </section>

      <section className="bg-soft-gray py-section-y">
        <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
          <h2 className="text-center font-display text-2xl font-bold text-secondary md:text-3xl">
            Nuestros Valores
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-gutter md:grid-cols-3">
            {valores.map(({ icon: Icon, titulo, texto }) => (
              <div key={titulo} className="rounded-xl bg-white p-6 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/30 text-secondary">
                  <Icon className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-secondary">{titulo}</h3>
                <p className="mt-2 font-body text-sm text-muted-foreground">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Carrusel de testimonios en video — pendiente de grabar (PLAN.md 5.3) */}
      <section className="bg-white py-section-y">
        <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
          <h2 className="text-center font-display text-2xl font-bold text-secondary md:text-3xl">
            Lo que dicen de nosotros
          </h2>
          <div className="mt-8 flex justify-center gap-4 overflow-x-auto pb-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="flex aspect-[9/16] w-48 shrink-0 flex-col items-center justify-center gap-2 rounded-xl bg-soft-gray text-muted-foreground"
              >
                <Play className="h-10 w-10" strokeWidth={1.5} />
                <span className="font-body text-xs">Testimonio pendiente</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
