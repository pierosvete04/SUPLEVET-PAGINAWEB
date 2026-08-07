import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Franja superior de oferta (PLAN.md sección 5.1) — enlaza a la política de
// envíos real (app/legal/envios), donde vive el detalle de zonas/tiempos/costos.
export function AnnouncementBar() {
  return (
    <Link
      href="/legal/envios"
      className="block bg-accent px-4 py-2 text-center font-body text-xs font-bold leading-snug tracking-wide text-accent-foreground transition-opacity hover:opacity-90 sm:px-6 md:text-sm"
    >
      {/* La flecha va inline (no como flex item hermano) para que en móvil, cuando
          el texto envuelve a dos líneas, siga pegada a la última palabra en vez de
          quedar centrada contra el borde derecho. */}
      Envío GRATIS por compras desde S/.170 Lima Metropolitana{" "}
      <span className="whitespace-nowrap">
        (Aplican TyC)
        <ArrowRight
          className="ml-1.5 inline-block h-3.5 w-3.5 align-[-0.15em]"
          strokeWidth={2.5}
        />
      </span>
    </Link>
  );
}
