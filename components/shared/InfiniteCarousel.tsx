"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfiniteCarouselProps {
  items: ReactNode[];
  ariaLabel: string;
  className?: string;
  /** true = se desplaza solo de forma continua; se pausa mientras el usuario
   * arrastra, hace hover o toca, y retoma unos segundos después. */
  autoScroll?: boolean;
}

const REPETICIONES = 3;
const UMBRAL_ARRASTRE_PX = 5;
const AUTOSCROLL_PX_POR_FRAME = 0.6;
const AUTOSCROLL_REANUDAR_MS = 2500;

// Carrusel circular infinito: triplica la lista (clon-izquierdo, real,
// clon-derecho) y arranca centrado en el primer elemento del set real. Al
// acercarse a los bordes clonados, salta sin animación al punto equivalente
// del set real — el usuario nunca ve el "reinicio", el loop se siente
// indefinido en ambas direcciones.
export function InfiniteCarousel({ items, ariaLabel, className, autoScroll = false }: InfiniteCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const arrastrando = useRef(false);
  const seHaMovido = useRef(false);
  const inicioArrastre = useRef({ x: 0, scrollLeft: 0 });
  const [listo, setListo] = useState(false);
  const pausado = useRef(false);
  const reanudarTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function pausarAutoScroll() {
    pausado.current = true;
    clearTimeout(reanudarTimeout.current);
    reanudarTimeout.current = setTimeout(() => {
      pausado.current = false;
    }, AUTOSCROLL_REANUDAR_MS);
  }

  const total = items.length;
  const extendidos = Array.from({ length: REPETICIONES }, (_, set) =>
    items.map((item, i) => ({ item, key: `${set}-${i}` }))
  ).flat();

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || total === 0) return;
    const primerItemReal = scroller.children[total] as HTMLElement | undefined;
    if (primerItemReal) {
      scroller.scrollLeft =
        primerItemReal.offsetLeft - (scroller.clientWidth - primerItemReal.clientWidth) / 2;
    }
    setListo(true);
  }, [total]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !listo || total === 0) return;

    function alScrollear() {
      // Solo corrige en los extremos reales del scroll (no en los tercios
      // teóricos): así queda un set completo de margen a cada lado del punto
      // centrado inicial, sin importar cuántas tarjetas quepan en pantalla.
      const unSet = scroller!.scrollWidth / REPETICIONES;
      const maxScroll = scroller!.scrollWidth - scroller!.clientWidth;
      if (scroller!.scrollLeft <= 0) {
        scroller!.scrollLeft += unSet;
      } else if (scroller!.scrollLeft >= maxScroll) {
        scroller!.scrollLeft -= unSet;
      }
    }

    scroller.addEventListener("scroll", alScrollear);
    return () => scroller.removeEventListener("scroll", alScrollear);
  }, [listo, total]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !listo || !autoScroll) return;

    let frame: number;
    function tick() {
      if (!pausado.current && !arrastrando.current) {
        scroller!.scrollLeft += AUTOSCROLL_PX_POR_FRAME;
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [listo, autoScroll]);

  function desplazar(direccion: 1 | -1) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    pausarAutoScroll();
    const item = scroller.querySelector<HTMLElement>("[data-carousel-item]");
    const paso = item ? item.offsetWidth + 16 : 300;
    scroller.scrollBy({ left: paso * direccion, behavior: "smooth" });
  }

  function alBajarMouse(e: React.MouseEvent) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    arrastrando.current = true;
    seHaMovido.current = false;
    pausarAutoScroll();
    inicioArrastre.current = { x: e.pageX, scrollLeft: scroller.scrollLeft };
  }

  function alMoverMouse(e: React.MouseEvent) {
    if (!arrastrando.current) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const delta = e.pageX - inicioArrastre.current.x;
    if (Math.abs(delta) > UMBRAL_ARRASTRE_PX) seHaMovido.current = true;
    scroller.scrollLeft = inicioArrastre.current.scrollLeft - delta;
  }

  function alSoltarMouse() {
    arrastrando.current = false;
  }

  function alHacerClickCapturado(e: React.MouseEvent) {
    if (seHaMovido.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  if (total === 0) return null;

  return (
    <div className={cn("relative", className)}>
      <div
        ref={scrollerRef}
        role="region"
        aria-label={ariaLabel}
        className="no-scrollbar flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto active:cursor-grabbing"
        onMouseDown={alBajarMouse}
        onMouseMove={alMoverMouse}
        onMouseUp={alSoltarMouse}
        onMouseLeave={alSoltarMouse}
        onMouseEnter={pausarAutoScroll}
        onTouchStart={pausarAutoScroll}
        onWheel={pausarAutoScroll}
        onClickCapture={alHacerClickCapturado}
      >
        {extendidos.map(({ item, key }) => (
          <div key={key} data-carousel-item className="snap-center">
            {item}
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Anterior"
        onClick={() => desplazar(-1)}
        className="absolute left-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2 text-secondary shadow-md hover:bg-soft-gray md:flex"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={2} />
      </button>
      <button
        type="button"
        aria-label="Siguiente"
        onClick={() => desplazar(1)}
        className="absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2 text-secondary shadow-md hover:bg-soft-gray md:flex"
      >
        <ChevronRight className="h-5 w-5" strokeWidth={2} />
      </button>
    </div>
  );
}
