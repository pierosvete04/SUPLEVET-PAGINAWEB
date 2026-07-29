"use client";

import { Toaster as Sonner } from "sonner";

// Toaster dedicado del portal — el <Toaster/> genérico de components/ui/sonner.tsx
// se deja intacto (lo puede usar el resto del sitio) para no filtrarle los colores
// de marca del portal. Estilo fijo (no sigue tema claro/oscuro del sistema): la
// identidad del portal es un esquema navy/orange fijo, no adaptativo.
export function PortalToaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-[10px] border border-white/10 bg-portal-navy-dark text-white shadow-xl",
          title: "font-bold text-white",
          description: "text-white/70",
          closeButton: "bg-portal-navy-dark border-white/10 text-white/60 hover:text-white",
          icon: "text-portal-orange",
        },
      }}
    />
  );
}
