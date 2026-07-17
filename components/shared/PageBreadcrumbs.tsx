import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBreadcrumbsProps {
  items: BreadcrumbItem[];
}

// Índice de navegación superior (ej. "Inicio / Productos / Suplevet 150g") —
// se coloca al inicio del contenido, debajo del header, en páginas con una
// jerarquía clara (listados, fichas de detalle, legales).
export function PageBreadcrumbs({ items }: PageBreadcrumbsProps) {
  return (
    <nav
      aria-label="Ruta de navegación"
      className="mx-auto max-w-container px-mobile-margin pt-5 md:px-gutter"
    >
      <ol className="flex flex-wrap items-center gap-1.5 font-body text-xs text-muted-foreground">
        <li>
          <Link href="/" className="flex items-center gap-1 hover:text-secondary">
            <Home className="h-3.5 w-3.5" />
            Inicio
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5 overflow-hidden">
            <ChevronRight className="h-3 w-3 shrink-0" />
            {item.href ? (
              <Link href={item.href} className="hover:text-secondary">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="truncate font-bold text-secondary">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
