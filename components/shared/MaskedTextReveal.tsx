"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { gsap, SplitText, registrarSplitText } from "@/lib/gsap";

interface MaskedTextRevealProps {
  children: ReactNode;
  /** Elemento HTML a renderizar (h1, h2, p...). Por defecto "span". */
  as?: ElementType;
  className?: string;
  /** Retraso en segundos antes de iniciar la animación. */
  delay?: number;
  /** Unidad a dividir/enmascarar — "lines" para títulos cortos, "words" para
   * frases más largas donde animar línea por línea se vería muy lento. */
  type?: "lines" | "words";
}

// Réplica del efecto "text masking" de gsap.com/demo/text-masking: SplitText
// divide el texto y envuelve cada parte en su propio contenedor con
// overflow:hidden (mask: true/"lines"), así cada línea/palabra "aparece"
// deslizándose desde abajo en vez de simplemente hacer fade-in plano. Se usa
// para el mensaje de bienvenida del primer registro en el portal de clientes.
export function MaskedTextReveal({
  children,
  as: Tag = "span",
  className = "",
  delay = 0,
  type = "lines",
}: MaskedTextRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefiereMenosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefiereMenosMovimiento) return;

    registrarSplitText();
    let split: InstanceType<typeof SplitText> | null = null;
    const ctx = gsap.context(() => {
      split = new SplitText(el, {
        type,
        mask: type,
        autoSplit: true,
      });
      const partes = type === "lines" ? split.lines : split.words;
      gsap.from(partes, {
        yPercent: 110,
        opacity: 0,
        duration: 0.9,
        delay,
        stagger: 0.08,
        ease: "power3.out",
      });
    }, el);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, [delay, type]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
