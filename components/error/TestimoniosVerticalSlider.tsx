"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Star, X } from "lucide-react";
import type { TestimonioVideo } from "@/lib/testimonios";
import { optimizedImageSrc } from "@/lib/images";
import { cn } from "@/lib/utils";

interface TestimoniosVerticalSliderProps {
  testimonios: TestimonioVideo[];
}

const AUTOPLAY_MS = 5000;
const UMBRAL_SWIPE_PX = 45;
const ANCHO_THUMBNAIL = 640;

// Slider de una sola tarjeta vertical (9:16), pensado para vivir en una
// columna angosta — a diferencia del coverflow de /nosotros
// (components/nosotros/TestimoniosCarousel.tsx), que necesita ancho completo
// para mostrar las tarjetas vecinas y aquí se saldría de la columna.
//
// Las tarjetas se apilan en el mismo espacio y solo cambia la opacidad: así
// el alto del contenedor no depende de cuál esté activa y no hay salto de
// layout (CLS) al avanzar.
export function TestimoniosVerticalSlider({ testimonios }: TestimoniosVerticalSliderProps) {
  const [activo, setActivo] = useState(0);
  const [abierto, setAbierto] = useState<TestimonioVideo | null>(null);
  const pausado = useRef(false);
  const inicioSwipe = useRef<number | null>(null);

  const total = testimonios.length;

  useEffect(() => {
    if (total <= 1) return;
    const intervalo = setInterval(() => {
      // El modal abierto también cuenta como pausa: avanzar por detrás del
      // video dejaría al cerrar una tarjeta distinta a la que se abrió.
      if (!pausado.current) setActivo((i) => (i + 1) % total);
    }, AUTOPLAY_MS);
    return () => clearInterval(intervalo);
  }, [total]);

  useEffect(() => {
    pausado.current = abierto !== null;
  }, [abierto]);

  // Cerrar con Escape — el modal es la única capa que atrapa el foco visual.
  useEffect(() => {
    if (!abierto) return;
    function alPresionar(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(null);
    }
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [abierto]);

  if (total === 0) return null;

  function irA(index: number) {
    pausado.current = true;
    setActivo(((index % total) + total) % total);
  }

  function alTocarInicio(e: React.TouchEvent) {
    inicioSwipe.current = e.touches[0].clientX;
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
        className="relative mx-auto w-full max-w-[280px] sm:max-w-[340px]"
        onMouseEnter={() => (pausado.current = true)}
        onMouseLeave={() => (pausado.current = abierto !== null)}
        onTouchStart={alTocarInicio}
        onTouchEnd={alTocarFin}
      >
        <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[var(--radius-card)] shadow-[0_18px_50px_rgba(37,60,97,0.22)]">
          {testimonios.map((t, i) => {
            const esActivo = i === activo;
            return (
              <button
                key={t.id}
                type="button"
                aria-label={`Ver testimonio: ${t.titulo}`}
                aria-hidden={!esActivo}
                tabIndex={esActivo ? undefined : -1}
                onClick={() => setAbierto(t)}
                className={cn(
                  "group absolute inset-0 h-full w-full cursor-pointer text-white transition-opacity duration-500 ease-out",
                  esActivo ? "opacity-100" : "pointer-events-none opacity-0"
                )}
              >
                {t.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={optimizedImageSrc(t.thumbnail_url, ANCHO_THUMBNAIL)}
                    alt=""
                    // La primera tarjeta es la que se ve al abrir la página:
                    // con lazy quedaría en negro hasta que el navegador
                    // decida cargarla. Las demás sí esperan.
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/20" />

                <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-white/35">
                  <Play className="h-7 w-7 translate-x-0.5 drop-shadow" strokeWidth={1.5} fill="white" />
                </span>

                <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-1.5 p-4 pb-5 text-left">
                  <span className="font-body text-sm font-bold drop-shadow">{t.titulo}</span>
                  <span className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, star) => (
                      <Star
                        key={star}
                        className="h-3.5 w-3.5 text-yellow-400"
                        fill="currentColor"
                        strokeWidth={0}
                      />
                    ))}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Testimonio anterior"
              onClick={() => irA(activo - 1)}
              className="absolute -left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 text-secondary shadow-md transition-colors hover:bg-soft-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Testimonio siguiente"
              onClick={() => irA(activo + 1)}
              className="absolute -right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 text-secondary shadow-md transition-colors hover:bg-soft-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2} />
            </button>

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
          </>
        )}
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
