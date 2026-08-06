"use client";

import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Video decorativo que no descarga nada hasta acercarse a la pantalla
// ---------------------------------------------------------------------------
// Los 4 videos de "¿Cómo se prepara?" pesan 3,2 MB en total y estaban con
// `autoplay` + `preload="auto"`: el navegador los empezaba a bajar los cuatro
// junto con el HTML, compitiendo con la imagen del hero por el ancho de banda.
// En la medición de PageSpeed en mobile (ago 2026) dos de ellos ni siquiera
// alcanzaban a terminar: aparecían como ERR_TIMED_OUT en la consola.
//
// Acá el <video> nace SIN `src`: recién se lo asignamos cuando el bloque se
// acerca al viewport (200px de margen para que llegue cargado). Antes de eso
// no hay ni una sola petición de red.
//
// Se deja `aria-hidden`: son videos mudos y decorativos, y el texto del paso
// que va debajo ya describe lo que muestran. Con aria-label los lectores de
// pantalla anunciaban un "video" del que además Lighthouse reclamaba
// subtítulos que no tienen sentido en un clip sin audio ni diálogo.

/** Cuánto antes de entrar en pantalla empezamos a cargar. */
const MARGEN_PRECARGA = "200px";

interface VideoEnViewportProps {
  src: string;
  className?: string;
}

export function VideoEnViewport({ src, className = "" }: VideoEnViewportProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [cargar, setCargar] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Sin IntersectionObserver (navegadores muy viejos) cargamos de una: es
    // preferible el comportamiento anterior a quedarnos con un hueco vacío.
    if (typeof IntersectionObserver === "undefined") {
      setCargar(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setCargar(true);
          observer.disconnect();
        }
      },
      { rootMargin: MARGEN_PRECARGA }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!cargar) return;
    // `play()` rechaza si el navegador bloquea la reproducción automática; al
    // estar muteado no debería pasar, pero un rechazo sin capturar ensucia la
    // consola con un unhandled rejection.
    ref.current?.play().catch(() => {});
  }, [cargar]);

  return (
    <video
      ref={ref}
      src={cargar ? src : undefined}
      aria-hidden="true"
      className={className}
      autoPlay
      loop
      muted
      playsInline
      preload="none"
    />
  );
}
