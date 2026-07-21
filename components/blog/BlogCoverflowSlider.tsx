"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import type { BlogPost } from "@/lib/data/blog-shared";
import { formatFechaPost } from "@/lib/data/blog-shared";
import { cn } from "@/lib/utils";

interface BlogCoverflowSliderProps {
  posts: BlogPost[];
}

const AUTOPLAY_MS = 4000;
const UMBRAL_SWIPE_PX = 45;

// Separación horizontal entre tarjetas vecinas. Vive en CSS —y no en estado—
// para que siga al viewport sin listeners: las tarjetas miden 320px en móvil y
// con la separación de escritorio las vecinas quedarían fuera de pantalla.
const SEPARACION = "[--coverflow-sep:200px] sm:[--coverflow-sep:280px]";

// Carrusel "coverflow" de artículos del blog — misma mecánica que
// TestimoniosCarousel (Nosotros): la tarjeta activa queda al centro, grande y
// al frente; las vecinas se ven más chicas y detrás. Se usa tanto en Home
// como en Nosotros para invitar a leer el blog.
export function BlogCoverflowSlider({ posts }: BlogCoverflowSliderProps) {
  const [activo, setActivo] = useState(0);
  const pausado = useRef(false);
  const inicioSwipe = useRef<number | null>(null);
  const seHaDeslizado = useRef(false);

  const total = posts.length;

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
  // descartarlo y que deslizar no navegue al artículo.
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
    <div
      onMouseEnter={() => (pausado.current = true)}
      onMouseLeave={() => (pausado.current = false)}
      onTouchStart={alTocarInicio}
      onTouchMove={alTocarMover}
      onTouchEnd={alTocarFin}
    >
      <div
        className={cn(
          "relative flex h-[460px] items-center justify-center overflow-hidden sm:h-[540px]",
          SEPARACION
        )}
      >
        {posts.map((post, i) => {
          let offset = i - activo;
          if (offset > total / 2) offset -= total;
          if (offset < -total / 2) offset += total;

          const distancia = Math.abs(offset);
          const visible = distancia <= 2;
          const escala = offset === 0 ? 1 : distancia === 1 ? 0.86 : 0.74;
          const esActiva = offset === 0;

          // El tipo de elemento se mantiene estable en todas las posiciones: si
          // alternara entre <a> y <button> según la tarjeta activa, React
          // desmontaría y remontaría ese nodo en cada avance y la tarjeta
          // aparecería de golpe en su sitio en vez de deslizarse.
          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              aria-label={
                esActiva ? `Leer artículo: ${post.titulo}` : `Ver artículo: ${post.titulo}`
              }
              aria-hidden={!visible}
              tabIndex={visible ? undefined : -1}
              onClick={(e) => {
                // Las tarjetas laterales primero se traen al centro; solo la
                // activa navega al artículo, y nunca si se venía deslizando.
                if (seHaDeslizado.current) {
                  e.preventDefault();
                  return;
                }
                if (!esActiva) {
                  e.preventDefault();
                  irA(i);
                }
              }}
              style={{
                transform: `translateX(calc(var(--coverflow-sep) * ${offset})) scale(${escala})`,
                zIndex: 10 - distancia,
                opacity: visible ? 1 : 0,
              }}
              className="group absolute flex aspect-[4/5] w-80 shrink-0 flex-col overflow-hidden rounded-[var(--radius-card)] bg-secondary text-white shadow-xl transition-[transform,opacity] duration-500 ease-out sm:w-[26rem]"
            >
              {post.imagen_destacada ? (
                <Image
                  src={post.imagen_destacada}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 320px, 416px"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-secondary">
                  <FileText className="h-10 w-10 text-white/40" strokeWidth={1.5} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

              <span className="relative m-4 inline-flex w-fit items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 font-body text-xs font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                Blog
              </span>

              <div className="relative mt-auto flex flex-col gap-3 p-5">
                <p className="font-display text-lg font-bold leading-snug drop-shadow line-clamp-2">
                  {post.titulo}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-body text-sm text-white/70">
                    {formatFechaPost(post.fecha_publicacion)}
                  </span>
                  <span className="rounded-[17px] bg-white px-4 py-1.5 font-body text-sm font-bold text-secondary transition-opacity group-hover:opacity-90">
                    Ver
                  </span>
                </div>
              </div>
            </Link>
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
        {posts.map((post, i) => (
          <button
            key={post.slug}
            type="button"
            aria-label={`Ir al artículo ${i + 1}`}
            onClick={() => irA(i)}
            className={cn(
              "h-2 rounded-full transition-all",
              i === activo ? "w-6 bg-secondary" : "w-2 bg-secondary/25"
            )}
          />
        ))}
      </div>
    </div>
  );
}
