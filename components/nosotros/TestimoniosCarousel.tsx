"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Star, X } from "lucide-react";
import type { TestimonioVideo } from "@/lib/testimonios";
import { cn } from "@/lib/utils";

interface TestimoniosCarouselProps {
  testimonios: TestimonioVideo[];
}

const AUTOPLAY_MS = 4500;
const UMBRAL_SWIPE_PX = 45;

// Separación horizontal entre tarjetas vecinas. Vive en CSS —y no en estado—
// para que siga al viewport sin listeners: las tarjetas miden 240px en móvil y
// con la separación de escritorio las vecinas quedarían fuera de pantalla.
const SEPARACION = "[--coverflow-sep:150px] sm:[--coverflow-sep:190px]";

// Carrusel "coverflow": la tarjeta activa queda al centro, grande y al
// frente; las vecinas se ven más chicas y detrás — misma mecánica plana
// (sin rotación ni oscurecido) que BlogCoverflowSlider, para que ambos
// carruseles del sitio se vean consistentes.
export function TestimoniosCarousel({ testimonios }: TestimoniosCarouselProps) {
  const [abierto, setAbierto] = useState<TestimonioVideo | null>(null);
  const [activo, setActivo] = useState(0);
  const pausado = useRef(false);
  const inicioSwipe = useRef<number | null>(null);
  const seHaDeslizado = useRef(false);

  const total = testimonios.length;

  useEffect(() => {
    if (total <= 1) return;
    const intervalo = setInterval(() => {
      if (!pausado.current) setActivo((i) => (i + 1) % total);
    }, AUTOPLAY_MS);
    return () => clearInterval(intervalo);
  }, [total]);

  if (total === 0) return null;

  function irA(index: number) {
    pausado.current = true;
    setActivo(((index % total) + total) % total);
  }

  function alTocarInicio(e: React.TouchEvent) {
    pausado.current = true;
    inicioSwipe.current = e.touches[0].clientX;
    seHaDeslizado.current = false;
  }

  // El click sintético llega después del touchend: marcar el arrastre permite
  // descartarlo y que deslizar no abra el video de la tarjeta.
  function alTocarMover(e: React.TouchEvent) {
    if (inicioSwipe.current === null) return;
    if (Math.abs(e.touches[0].clientX - inicioSwipe.current) > UMBRAL_SWIPE_PX) {
      seHaDeslizado.current = true;
    }
  }

  function alTocarFin(e: React.TouchEvent) {
    if (inicioSwipe.current === null) return;
    const recorrido = e.changedTouches[0].clientX - inicioSwipe.current;
    inicioSwipe.current = null;
    if (Math.abs(recorrido) < UMBRAL_SWIPE_PX) return;
    irA(activo + (recorrido < 0 ? 1 : -1));
  }

  return (
    <>
      <div
        className={cn(
          "relative flex h-[420px] items-center justify-center overflow-hidden sm:h-[480px]",
          SEPARACION
        )}
        onMouseEnter={() => (pausado.current = true)}
        onMouseLeave={() => (pausado.current = false)}
        onTouchStart={alTocarInicio}
        onTouchMove={alTocarMover}
        onTouchEnd={alTocarFin}
      >
        {testimonios.map((t, i) => {
          let offset = i - activo;
          if (offset > total / 2) offset -= total;
          if (offset < -total / 2) offset += total;

          const distancia = Math.abs(offset);
          const visible = distancia <= 2;
          const escala = offset === 0 ? 1 : distancia === 1 ? 0.86 : 0.74;
          const esActiva = offset === 0;

          return (
            <button
              key={t.id}
              type="button"
              aria-label={`Ver testimonio: ${t.titulo}`}
              aria-hidden={!visible}
              tabIndex={visible ? undefined : -1}
              onClick={() => {
                if (seHaDeslizado.current) return;
                if (esActiva) setAbierto(t);
                else irA(i);
              }}
              style={{
                transform: `translateX(calc(var(--coverflow-sep) * ${offset})) scale(${escala})`,
                zIndex: 10 - distancia,
                opacity: visible ? 1 : 0,
              }}
              className="group absolute flex aspect-[9/16] w-60 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[var(--radius-card)] text-white shadow-xl transition-[transform,opacity] duration-500 ease-out sm:w-72"
            >
              {t.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.thumbnail_url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent" />
              {/* Siempre montado y atenuado por opacidad: si se montara solo en
                  la tarjeta activa, aparecería de golpe en cada avance en vez
                  de fundirse con el resto de la transición. */}
              <span
                className={cn(
                  "relative flex h-14 w-14 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm transition-opacity duration-500 group-hover:bg-white/35",
                  esActiva ? "opacity-100" : "opacity-0"
                )}
              >
                <Play className="h-6 w-6 translate-x-0.5 drop-shadow" strokeWidth={1.5} fill="white" />
              </span>
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-1 p-4 text-left">
                <span className="font-body text-sm font-bold drop-shadow">{t.titulo}</span>
                <span className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, star) => (
                    <Star key={star} className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" strokeWidth={0} />
                  ))}
                </span>
              </div>
            </button>
          );
        })}

        <button
          type="button"
          aria-label="Anterior"
          onClick={() => irA(activo - 1)}
          className="absolute left-1 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white p-2 text-secondary shadow-md hover:bg-soft-gray sm:left-4"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} />
        </button>
        <button
          type="button"
          aria-label="Siguiente"
          onClick={() => irA(activo + 1)}
          className="absolute right-1 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white p-2 text-secondary shadow-md hover:bg-soft-gray sm:right-4"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {testimonios.map((t, i) => (
          <button
            key={t.id}
            type="button"
            aria-label={`Ir al testimonio ${i + 1}`}
            onClick={() => irA(i)}
            className={cn(
              "h-2 rounded-full transition-all",
              i === activo ? "w-6 bg-secondary" : "w-2 bg-secondary/25"
            )}
          />
        ))}
      </div>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setAbierto(null)}
        >
          <button
            type="button"
            aria-label="Cerrar video"
            onClick={() => setAbierto(null)}
            className="absolute right-4 top-4 z-10 text-white/80 hover:text-white"
          >
            <X className="h-8 w-8" />
          </button>
          <video
            src={abierto.video_url}
            className="max-h-full max-w-full rounded-md"
            controls
            autoPlay
            playsInline
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
