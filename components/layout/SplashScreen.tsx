"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Cuánto se mantiene visible antes de empezar a desvanecerse, y duración del fundido (ms).
const HOLD_MS = 900;
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
