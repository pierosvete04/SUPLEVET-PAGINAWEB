interface HillCurveProps {
  /** Clase de color de relleno (ej. "fill-secondary", "fill-white") — debe
   * coincidir con el fondo de la sección que viene DESPUÉS de la curva. */
  fillClassName: string;
  /** Clase de fondo de la sección ANTERIOR, para que no quede un borde visible. */
  bgClassName?: string;
}

// Curva orgánica convexa — firma visual de marca (PLAN.md sección 2), se usa
// en cada transición entre una sección de fondo sólido y la siguiente.
export function HillCurve({ fillClassName, bgClassName }: HillCurveProps) {
  return (
    <div className={bgClassName} aria-hidden="true">
      <svg
        className={`block h-10 w-full md:h-16 ${fillClassName}`}
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
      >
        <path d="M0,100 C480,0 960,0 1440,100 L1440,100 L0,100 Z" />
      </svg>
    </div>
  );
}
