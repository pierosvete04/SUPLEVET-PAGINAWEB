import { formatPrecio } from "@/lib/data/productos-shared";
import type { EnvioZona } from "@/lib/shipping";

// Antes de conocer la dirección del cliente (ej. en /carrito) se usa el
// umbral de Lima Metropolitana como referencia por defecto (mayor volumen de
// clientes). Una vez el checkout conoce la zona real, se le pasa por props.
const UMBRAL_ENVIO_GRATIS_LIMA = 150;

interface ShippingProgressBarProps {
  subtotal: number;
  zona?: EnvioZona;
}

export function ShippingProgressBar({ subtotal, zona }: ShippingProgressBarProps) {
  const umbral = zona?.monto_minimo_gratis ?? UMBRAL_ENVIO_GRATIS_LIMA;
  const progreso = Math.min(subtotal / umbral, 1) * 100;
  const faltante = Math.max(umbral - subtotal, 0);
  const cumplido = faltante === 0;

  return (
    <div className="rounded-xl bg-soft-gray p-4">
      <div className="flex items-center justify-between font-body text-xs font-bold text-secondary">
        <span>TÚ</span>
        <span>{formatPrecio(umbral)}</span>
      </div>
      <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${progreso}%` }}
        />
      </div>
      <p className="mt-2 font-body text-xs text-secondary">
        {cumplido ? (
          <span className="font-bold text-green-600">¡Tienes envío gratis! 🎉</span>
        ) : (
          <>
            Te faltan <strong>{formatPrecio(faltante)}</strong> para envío gratis
          </>
        )}
      </p>
      <p className="mt-1 font-body text-[11px] text-muted-foreground">
        {zona
          ? `Envío gratis a ${zona.nombre} desde ${formatPrecio(zona.monto_minimo_gratis)}.`
          : "Envío gratis en Lima Metropolitana desde S/.150 — el monto varía según tu zona."}
      </p>
    </div>
  );
}
