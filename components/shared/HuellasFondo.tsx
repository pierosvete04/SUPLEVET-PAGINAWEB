import { cn } from "@/lib/utils";

interface HuellasFondoProps {
  /** Debe ser único por instancia: dos <pattern> con el mismo id en la página
   * hacen que todas las referencias resuelvan a la primera definición. */
  id: string;
  className?: string;
}

// Textura de huellas de fondo — hereda el color del contenedor vía
// currentColor, así la misma pieza sirve sobre fondo claro y sobre navy solo
// cambiando la clase de texto. Decorativa: aria-hidden y sin eventos.
export function HuellasFondo({ id, className }: HuellasFondoProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    >
      <defs>
        <pattern
          id={id}
          width="150"
          height="150"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-18)"
        >
          <g fill="currentColor">
            <ellipse cx="34" cy="48" rx="12" ry="9.5" />
            <ellipse cx="20" cy="30" rx="4.8" ry="6.4" />
            <ellipse cx="31" cy="24" rx="4.8" ry="6.8" />
            <ellipse cx="43" cy="26" rx="4.8" ry="6.4" />
            <ellipse cx="52" cy="35" rx="4.2" ry="5.4" />
          </g>
          <g fill="currentColor" transform="translate(78, 82)">
            <ellipse cx="34" cy="48" rx="9" ry="7" />
            <ellipse cx="23" cy="34" rx="3.6" ry="4.8" />
            <ellipse cx="32" cy="29" rx="3.6" ry="5" />
            <ellipse cx="41" cy="31" rx="3.6" ry="4.8" />
            <ellipse cx="48" cy="38" rx="3.2" ry="4" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
