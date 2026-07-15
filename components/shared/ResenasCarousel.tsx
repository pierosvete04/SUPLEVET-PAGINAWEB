import { Quote, Star } from "lucide-react";
import { InfiniteCarousel } from "@/components/shared/InfiniteCarousel";
import type { ResenaPublica } from "@/lib/resenas";

interface ResenasCarouselProps {
  resenas: ResenaPublica[];
}

function Estrellas({ calificacion }: { calificacion: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${calificacion} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < calificacion ? "fill-primary text-primary" : "fill-transparent text-border"}`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function ResenaCard({ resena }: { resena: ResenaPublica }) {
  return (
    <div className="flex w-80 shrink-0 flex-col justify-between rounded-[var(--radius-card)] bg-soft-gray p-6 shadow-lg sm:w-96">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex rounded-full bg-secondary/10 px-3 py-1 font-body text-xs font-bold text-secondary">
            {resena.producto_nombre}
          </span>
          <Estrellas calificacion={resena.calificacion} />
        </div>
        <Quote className="mt-5 h-6 w-6 text-sky" strokeWidth={1.5} fill="currentColor" />
        <p className="mt-3 font-body text-base leading-snug text-secondary/90">{resena.texto}</p>
      </div>
      <div className="mt-6 border-t border-secondary/10 pt-4">
        <p className="font-body text-sm font-bold text-secondary">{resena.cliente_nombre || "Cliente Suplevet"}</p>
        {resena.cliente_ciudad && (
          <p className="font-body text-xs text-muted-foreground">{resena.cliente_ciudad}</p>
        )}
      </div>
    </div>
  );
}

export function ResenasCarousel({ resenas }: ResenasCarouselProps) {
  if (resenas.length === 0) return null;

  return (
    <InfiniteCarousel
      ariaLabel="Reseñas de clientes"
      className="mt-10"
      autoScroll
      items={resenas.map((r) => (
        <ResenaCard key={r.id} resena={r} />
      ))}
    />
  );
}
