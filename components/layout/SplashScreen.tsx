"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Cuánto se mantiene visible antes de empezar a desvanecerse, y duración del
// fundido (ms).
//
// El hold era de 900 ms y con el fundido tapaba la pantalla ~1,2 s completos.
// Como el splash es `fixed inset-0`, para el navegador ESE celeste es el
// primer contenido pintado: el hero y el texto real recién cuentan cuando el
// splash se va. Eso era lo que empujaba el First Contentful Paint a 2,0 s y el
// LCP a 4,7 s en la medición de PageSpeed en mobile (ago 2026).
//
// A 350 ms el gesto de marca se sigue percibiendo (la patita alcanza a hacer
// su animación de entrada) pero deja de bloquear la métrica. Si se vuelve a
// subir este número, se paga directo en el puntaje de rendimiento mobile.
const HOLD_MS = 350;
const FADE_MS = 300;

// Pantalla de bienvenida tipo "splash" de app nativa: celeste de marca +
// ícono de pata en blanco, solo en mobile (RootLayout no se vuelve a montar
// en navegaciones internas, así que esto solo aparece en la carga inicial,
// no en cada cambio de página).
export function SplashScreen() {
  const [fading, setFading] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), HOLD_MS);
    const unmountTimer = setTimeout(() => setMounted(false), HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-sky transition-opacity ease-in-out motion-reduce:duration-0 md:hidden ${
        fading ? "pointer-events-none opacity-0 duration-300" : "opacity-100 duration-0"
      }`}
    >
      <Image
        src="/logos/icon-only/icon-white.png"
        alt=""
        width={224}
        height={220}
        priority
        className="h-28 w-28 animate-splash-icon-in motion-reduce:animate-none"
      />
    </div>
  );
}
