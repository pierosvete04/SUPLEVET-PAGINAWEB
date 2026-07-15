"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { gsap, ScrollTrigger, registrarScrollTrigger } from "@/lib/gsap";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Retraso en segundos antes de iniciar la animación de este elemento. */
  delay?: number;
  /** Desplazamiento vertical inicial (px) — de dónde "entra" el contenido. */
  y?: number;
}

// Wrapper reutilizable de fade + slide-up al entrar en el viewport, con GSAP
// ScrollTrigger. Respeta prefers-reduced-motion (no anima, se muestra directo).
export function ScrollReveal({ children, className = "", delay = 0, y = 32 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefiereMenosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefiereMenosMovimiento) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }

    registrarScrollTrigger();
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            once: true,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [delay, y]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export { ScrollTrigger };
