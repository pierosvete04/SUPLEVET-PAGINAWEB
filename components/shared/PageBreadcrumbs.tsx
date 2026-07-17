import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBreadcrumbsProps {
  items: BreadcrumbItem[];
  /** true = se monta como overlay absoluto sobre un hero oscuro (texto claro),
   * en vez del bloque normal en flujo. Se usa cuando el hero es a pantalla
   * completa justo debajo del header (Blog, Nosotros) — como bloque normal
   * dejaba una franja blanca entre el header y el hero que lo partía en dos. */
  overlay?: boolean;
}

// Índice de navegación superior (ej. "Inicio / Productos / Suplevet 150g") —
// se coloca al inicio del contenido, debajo del header, en páginas con una
// jerarquía clara (listados, fichas de detalle, legales).
export function PageBreadcrumbs({ items, overlay = false }: PageBreadcrumbsProps) {
  return (
    <nav
      aria-label="Ruta de navegación"
      className={
        overlay
          ? "absolute inset-x-0 top-0 z-10 mx-auto max-w-container px-mobile-margin pt-4 md:px-gutter md:pt-6"
          : "mx-auto max-w-container px-mobile-margin pt-5 md:px-gutter"
      }
    >
      <ol
        className={`flex flex-wrap items-center gap-1.5 font-body text-xs ${
          overlay ? "text-white/70" : "text-muted-foreground"
        }`}
      >
        <li>
          <Link
            href="/"
            className={`flex items-center gap-1 ${overlay ? "hover:text-white" : "hover:text-secondary"}`}
          >
            <Home className="h-3.5 w-3.5" />
            Inicio
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5 overflow-hidden">
            <ChevronRight className="h-3 w-3 shrink-0" />
            {item.href ? (
              <Link href={item.href} className={overlay ? "hover:text-white" : "hover:text-secondary"}>
                {item.label}
              </Link>
            ) : (
              <span
                aria-current="page"
                className={`truncate font-bold ${overlay ? "text-white" : "text-secondary"}`}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
