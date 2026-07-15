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

// Carrusel "coverflow" de artículos del blog — misma mecánica que
// TestimoniosCarousel (Nosotros): la tarjeta activa queda al centro, grande y
// al frente; las vecinas se ven más chicas y detrás. Se usa tanto en Home
// como en Nosotros para invitar a leer el blog.
export function BlogCoverflowSlider({ posts }: BlogCoverflowSliderProps) {
  const [activo, setActivo] = useState(0);
  const pausado = useRef(false);

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

  return (
    <div
      onMouseEnter={() => (pausado.current = true)}
      onMouseLeave={() => (pausado.current = false)}
    >
      <div className="relative flex h-[420px] items-center justify-center overflow-hidden sm:h-[480px]">
        {posts.map((post, i) => {
          let offset = i - activo;
          if (offset > total / 2) offset -= total;
          if (offset < -total / 2) offset += total;

          const visible = Math.abs(offset) <= 2;
          const escala = offset === 0 ? 1 : Math.abs(offset) === 1 ? 0.86 : 0.74;
          const traslado = offset * 250;

          const tarjeta = (
            <div
              style={{
                transform: `translateX(${traslado}px) scale(${escala})`,
                zIndex: 10 - Math.abs(offset),
                opacity: visible ? 1 : 0,
              }}
              className="group absolute flex aspect-[4/5] w-72 shrink-0 flex-col overflow-hidden rounded-[var(--radius-card)] bg-secondary text-white shadow-xl transition-all duration-500 ease-out sm:w-80"
            >
              {post.imagen_destacada ? (
                <Image
                  src={post.imagen_destacada}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="320px"
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
                  <span className="rounded-full bg-white px-4 py-1.5 font-body text-sm font-bold text-secondary transition-opacity group-hover:opacity-90">
                    Ver
                  </span>
                </div>
              </div>
            </div>
          );

          return offset === 0 ? (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              aria-label={`Leer artículo: ${post.titulo}`}
              className="contents"
            >
              {tarjeta}
            </Link>
          ) : (
            <button
              key={post.slug}
              type="button"
              aria-label={`Ver artículo: ${post.titulo}`}
              onClick={() => irA(i)}
              className="contents cursor-pointer"
            >
              {tarjeta}
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
