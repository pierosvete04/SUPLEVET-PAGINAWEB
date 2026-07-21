import Image from "next/image";

import { cn } from "@/lib/utils";

interface BrandedLoaderProps {
  label?: string;
  /** Loader chico en línea (spinner + texto) para widgets anidados dentro de una página ya cargada. */
  compact?: boolean;
  /** Cubre el viewport completo — para loading.tsx de segmentos de ruta. */
  fullScreen?: boolean;
  className?: string;
}

/**
 * Pantalla de carga de marca: logo Suplevet + barra indeterminada.
 * Reemplaza los `<p>Cargando…</p>` sueltos repartidos por portal/admin/vet.
 */
export function BrandedLoader({ label = "Cargando…", compact = false, fullScreen = false, className }: BrandedLoaderProps) {
  if (compact) {
    return (
      <div role="status" aria-live="polite" className={cn("flex items-center gap-2.5 py-6 text-sm text-muted-foreground", className)}>
        <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
        {label}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-5 py-20 text-center",
        fullScreen && "fixed inset-0 z-50 bg-background py-0",
        className,
      )}
    >
      <Image
        src="/logos/logo-color-horizontal.png"
        alt="Suplevet"
        width={140}
        height={30}
        priority={fullScreen}
        className="h-auto w-[140px] animate-loader-pulse"
      />
      <span className="block h-1 w-32 overflow-hidden rounded-full bg-primary/15">
        <span className="block h-full w-1/3 rounded-full bg-primary animate-loader-bar" />
      </span>
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}
