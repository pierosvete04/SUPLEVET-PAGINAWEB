"use client";

import Image from "next/image";
import { whatsappLink } from "@/lib/site-config";
import { useConfiguracionSitio } from "@/hooks/use-configuracion-sitio";
import { trackEvent } from "@/lib/analytics";

// Botón flotante de WhatsApp general (PLAN.md sección 5.1) — usa el número B2C,
// distinto del botón "¿Eres veterinario?" del header (ver Header.tsx).
export function WhatsAppFloat() {
  const config = useConfiguracionSitio();
  return (
    <a
      href={whatsappLink(config.whatsappB2C, "Hola, quisiera más información sobre Suplevet")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      onClick={() => trackEvent("whatsapp_click", { origen: "boton_flotante" })}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
    >
      <Image src="/icons/whatsapp-navbar.png" alt="" width={56} height={56} />
    </a>
  );
}
