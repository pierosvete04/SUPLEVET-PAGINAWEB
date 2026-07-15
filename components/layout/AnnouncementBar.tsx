import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Franja superior de oferta (PLAN.md sección 5.1) — enlaza a la política de
// envíos real (app/legal/envios), donde vive el detalle de zonas/tiempos/costos.
export function AnnouncementBar() {
  return (
    <Link
      href="/legal/envios"
      className="flex items-center justify-center gap-1.5 bg-accent py-2 text-center font-body text-xs font-bold tracking-wide text-white transition-opacity hover:opacity-90 md:text-sm"
    >
      Envío GRATIS por compras desde S/.150 Lima Metropolitana (Aplican TyC)
      <ArrowRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
    </Link>
  );
}
