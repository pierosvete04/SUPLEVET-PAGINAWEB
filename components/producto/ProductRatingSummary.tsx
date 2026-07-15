import { Star } from "lucide-react";
import type { ResenaProducto } from "@/lib/resenas";

interface ProductRatingSummaryProps {
  resenas: ResenaProducto[];
}

export function ProductRatingSummary({ resenas }: ProductRatingSummaryProps) {
  if (resenas.length === 0) return null;

  const promedio = resenas.reduce((suma, r) => suma + r.calificacion, 0) / resenas.length;
  const promedioRedondeado = Math.round(promedio);

  return (
    <a href="#resenas" className="mt-2 flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((v) => (
          <Star
            key={v}
            className="h-4 w-4"
            fill={v <= promedioRedondeado ? "#EA8C43" : "none"}
            color={v <= promedioRedondeado ? "#EA8C43" : "#d1d5db"}
          />
        ))}
      </div>
      <span className="font-body text-sm font-bold text-secondary underline-offset-2 hover:underline">
        {promedio.toFixed(1)} · {resenas.length} reseña{resenas.length === 1 ? "" : "s"}
      </span>
    </a>
  );
}
