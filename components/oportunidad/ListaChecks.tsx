import { cn } from "@/lib/utils";

interface ListaChecksProps {
  items: string[];
  className?: string;
}

/**
 * Lista con check en círculo de acento. Se usa en la banda de producto (texto
 * blanco sobre navy) y en el bloque de condiciones de Ventajas (navy sobre
 * blanco): el color del texto se hereda del contenedor para servir a ambos.
 */
export function ListaChecks({ items, className }: ListaChecksProps) {
  return (
    <ul className={cn("flex flex-col gap-3 font-body text-sm", className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <svg
              viewBox="0 0 24 24"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              aria-hidden="true"
            >
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}
