// Lucide (la librería de iconos SVG que ya usa el resto del portal) no trae
// símbolos de género — estos dos replican su mismo estilo (trazo redondeado,
// viewBox 24x24) para que encajen sin desentonar junto al resto de iconos.
import type { SVGProps } from "react";

export function MaleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="9" cy="15" r="6" />
      <path d="M15 9 21 3" />
      <path d="M15 3h6v6" />
    </svg>
  );
}

export function FemaleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M12 14v7" />
      <path d="M9 18h6" />
    </svg>
  );
}
