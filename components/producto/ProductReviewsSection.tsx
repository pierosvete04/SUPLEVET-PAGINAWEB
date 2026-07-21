import { MessageSquareText, Star } from "lucide-react";
import { formatFecha } from "@/lib/portal/formato";
import type { ResenaProducto } from "@/lib/resenas";
import { InfiniteCarousel } from "@/components/shared/InfiniteCarousel";

interface ProductReviewsSectionProps {
  resenas: ResenaProducto[];
}

function ResenaProductoCard({ r }: { r: ResenaProducto }) {
  return (
    <div className="flex w-80 shrink-0 flex-col rounded-[var(--radius-card)] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((v) => (
          <Star
            key={v}
            className="h-4 w-4"
            fill={v <= r.calificacion ? "#EA8C43" : "none"}
            color={v <= r.calificacion ? "#EA8C43" : "#d1d5db"}
          />
        ))}
      </div>
      <p className="mt-3 font-body text-sm text-secondary">{r.texto}</p>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div>
          <p className="font-body text-xs font-bold text-secondary">
            {r.cliente_nombre || "Cliente Suplevet"}
          </p>
          {r.cliente_ciudad && (
            <p className="font-body text-[11px] text-muted-foreground">{r.cliente_ciudad}</p>
          )}
        </div>
        <span className="font-body text-[11px] text-muted-foreground">{formatFecha(r.created_at)}</span>
      </div>
    </div>
  );
}

// pb reducido: le sigue directamente el FAQ, que comparte fondo — con el
// padding completo de ambos lados el hueco entre secciones se leía como un
// vacío. Mismo tratamiento que Blog → FAQ en Home.
export function ProductReviewsSection({ resenas }: ProductReviewsSectionProps) {
  return (
    <section id="resenas" className="bg-soft-gray pb-7 pt-section-y">
      <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
        <h2 className="text-center font-display text-2xl font-bold text-secondary md:text-3xl">
          Reseñas de clientes
        </h2>

        {resenas.length === 0 ? (
          <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-2 rounded-[var(--radius-card)] bg-white p-8 text-center shadow-sm">
            <MessageSquareText className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            <p className="font-body text-sm text-muted-foreground">
              Todavía no hay reseñas para este producto. Los clientes pueden dejar la suya desde{" "}
              <strong>Mis Pedidos</strong> en su cuenta, una vez que reciban su pedido.
            </p>
          </div>
        ) : (
          <InfiniteCarousel
            ariaLabel="Reseñas de este producto"
            className="mt-8"
            autoScroll
            items={resenas.map((r) => (
              <ResenaProductoCard key={r.id} r={r} />
            ))}
          />
        )}
      </div>
    </section>
  );
}
