"use client";

import { useRef, useEffect, useState, type CSSProperties, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Retraso en segundos antes de iniciar la animación de este elemento. */
  delay?: number;
  /** Desplazamiento vertical inicial (px) — de dónde "entra" el contenido. */
  y?: number;
}

// Wrapper reutilizable de fade + slide-up al entrar en el viewport.
//
// Antes esto usaba GSAP + ScrollTrigger. Se reemplazó por IntersectionObserver
// + una transición CSS (clase .scroll-reveal en globals.css) por tres razones:
//
//   1. GSAP entraba en el bundle de todo el sitio público solo por esto. Ahora
//      la librería queda únicamente en el portal (MaskedTextReveal y
//      PuntosDashboard), que es donde de verdad se usa su potencia.
//   2. ScrollTrigger monta un manejador de scroll por instancia; /nosotros tiene
//      27 y /oportunidad-de-negocio 29. IntersectionObserver no corre en el hilo
//      principal en cada scroll: el navegador avisa solo cuando algo cruza.
//   3. GSAP ponía el opacity:0 DESPUÉS de hidratar, así que el contenido se veía,
//      desaparecía y volvía. Con CSS el estado inicial viaja con el HTML.
//
// `once`: el observador se desconecta al primer cruce, igual que el `once: true`
// que tenía el ScrollTrigger anterior — el contenido no se vuelve a ocultar al
// scrollear para arriba.
export function ScrollReveal({ children, className = "", delay = 0, y = 32 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Navegador sin IntersectionObserver: mostrar sin animar es infinitamente
    // mejor que dejar la sección invisible.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    // Si el elemento YA está en pantalla al montar, se revela sin pasar por el
    // observador. Dos motivos:
    //
    //   - Las secciones de arriba no tienen por qué esperar un ciclo extra del
    //     navegador para aparecer; es contenido que el usuario ya está mirando.
    //   - El observador NO dispara mientras la pestaña está en segundo plano
    //     (document.hidden), igual que requestAnimationFrame. Si alguien abre
    //     el sitio con "abrir en pestaña nueva", el contenido se revelaría solo
    //     al cambiarse a esa pestaña. getBoundingClientRect sí funciona ahí, así
    //     que esta rama deja lo visible resuelto pase lo que pase.
    //
    // El 0.85 es el mismo umbral que el rootMargin de abajo.
    const alturaVentana = window.innerHeight || document.documentElement.clientHeight;
    const caja = el.getBoundingClientRect();
    if (caja.top < alturaVentana * 0.85 && caja.bottom > 0) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // Equivale al `start: "top 85%"` de la versión con ScrollTrigger: dispara
      // cuando el elemento entró un 15% en la pantalla, no apenas asoma.
      { rootMargin: "0px 0px -15% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      // `|| undefined` para que el atributo no exista mientras está oculto: el
      // selector de CSS es [data-revealed], que también casaría con "false".
      data-revealed={visible || undefined}
      className={`scroll-reveal ${className}`}
      style={{ "--sr-y": `${y}px`, "--sr-delay": `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}
