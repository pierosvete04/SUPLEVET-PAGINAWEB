import { Shield, Sprout, Zap, Dna, Dumbbell, Brain, HeartPulse, type LucideIcon } from "lucide-react";
import { ScrollReveal } from "@/components/shared/ScrollReveal";

interface Funcion {
  icon: LucideIcon;
  titulo: string;
  texto: string;
}

// Copy en lenguaje compliant para suplementos veterinarios: "apoya",
// "contribuye", "favorece" — nunca "previene", "trata" o "cura" (PLAN de
// contenido, sección Nosotros/Comparativa).
const FUNCIONES: Funcion[] = [
  { icon: Shield, titulo: "Función inmunológica", texto: "Ayuda a fortalecer la respuesta inmunológica." },
  {
    icon: Sprout,
    titulo: "Función digestiva",
    texto: "Ayuda a favorecer la microbiota y la salud intestinal.",
  },
  {
    icon: Zap,
    titulo: "Función metabólica",
    texto: "Ayuda a optimizar el aprovechamiento de nutrientes y la producción de energía.",
  },
  {
    icon: Dna,
    titulo: "Función celular",
    texto: "Ayuda a mantener el funcionamiento celular normal, aportando compuestos bioactivos.",
  },
  {
    icon: Dumbbell,
    titulo: "Función muscular",
    texto: "Ayuda a mantener la masa muscular, la fuerza y la recuperación nutricional.",
  },
  {
    icon: Brain,
    titulo: "Función neurológica",
    texto: "Ayuda a mantener el funcionamiento normal del sistema nervioso y cognitivo, gracias al DHA y EPA.",
  },
];

const BIENESTAR = {
  titulo: "Bienestar integral",
  texto: "Ayuda a mejorar la calidad de vida como complemento del manejo nutricional veterinario.",
};

export function FuncionesApoyadas() {
  return (
    <section className="bg-white py-section-y">
      <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
        <h2 className="text-center font-display text-2xl font-bold text-secondary md:text-3xl">
          ¿Qué funciones apoya Suplevet?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center font-body text-sm text-muted-foreground md:text-base">
          No solo aporta nutrientes: combina ingredientes bioactivos —lactoferrina, calostro bovino,
          proteína de suero, FOS, DHA, EPA, vitaminas y minerales— para apoyar al organismo en sus
          principales funciones fisiológicas.
        </p>

        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FUNCIONES.map(({ icon: Icon, titulo, texto }, i) => (
            <ScrollReveal key={titulo} delay={i * 0.08}>
              <div className="flex h-full flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-white p-5 shadow-[0_4px_16px_rgba(37,60,97,0.06)]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/20">
                  <Icon className="h-5 w-5 text-secondary" strokeWidth={1.75} />
                </span>
                <h3 className="font-display text-base font-bold text-secondary">{titulo}</h3>
                <p className="font-body text-sm leading-relaxed text-muted-foreground">{texto}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Bienestar integral cierra como resumen — no es "una función más" sino
            el resultado de apoyar todas las anteriores a la vez. */}
        <ScrollReveal delay={FUNCIONES.length * 0.08} className="mx-auto mt-4 max-w-4xl">
          <div className="flex flex-col items-start gap-3 rounded-[var(--radius-card)] bg-gradient-to-br from-primary to-[#d97a35] p-6 text-primary-foreground sm:flex-row sm:items-center sm:gap-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
              <HeartPulse className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <h3 className="font-display text-base font-bold">{BIENESTAR.titulo}</h3>
              <p className="mt-1 font-body text-sm leading-relaxed text-primary-foreground/90">
                {BIENESTAR.texto}
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
