import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ImagenConOverlayProps {
  imagen: string;
  alt: string;
  children: ReactNode;
  className?: string;
  /** Relación de aspecto del contenedor de imagen, por breakpoint. */
  aspectClassName?: string;
  /** Posición/tamaño del panel superpuesto — por defecto una tarjeta chica
   * pegada abajo-izquierda; pásalo para un panel más grande (ej. dos columnas). */
  panelClassName?: string;
}

const ASPECT_DEFAULT = "aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9]";
const PANEL_DEFAULT = "inset-x-4 bottom-4 max-w-lg md:inset-x-8 md:bottom-8";

// Contenedor con foto de fondo real y un panel "glassmorphic" (fondo
// semitransparente + backdrop-blur, que distorsiona lo que hay detrás)
// superpuesto — reutilizable en cualquier página, el contenido del panel lo
// define quien lo usa (children).
export function ImagenConOverlay({
  imagen,
  alt,
  children,
  className,
  aspectClassName,
  panelClassName,
}: ImagenConOverlayProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-[var(--radius-card)]", className)}>
      <div className={cn("relative w-full", aspectClassName ?? ASPECT_DEFAULT)}>
        <Image src={imagen} alt={alt} fill className="object-cover" sizes="100vw" />
      </div>
      <div
        className={cn(
          "absolute rounded-[var(--radius-card)] bg-secondary/50 p-6 backdrop-blur-md md:p-10",
          panelClassName ?? PANEL_DEFAULT
        )}
      >
        {children}
      </div>
    </div>
  );
}
