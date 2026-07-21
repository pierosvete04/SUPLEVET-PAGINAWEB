"use client";

import { useEffect } from "react";
import { logConsoleBanner } from "@/lib/branding/console-banner";

// Branding decorativo en la consola del navegador (logo en texto + advertencia
// self-XSS). No es una medida de seguridad — el código sigue siendo visible
// para cualquiera, como todo JS de cliente. Los secretos reales se protegen
// vía variables de entorno server-only (ver lib/supabase/admin.ts).
// Módulo-level: evita el doble log del Strict Mode de React en desarrollo
// (monta los efectos dos veces a propósito). En producción de todas formas
// solo se monta una vez.
let hasLogged = false;

export function ConsoleBanner() {
  useEffect(() => {
    if (hasLogged) return;
    hasLogged = true;
    logConsoleBanner();
  }, []);

  return null;
}
