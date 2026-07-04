import { formatPrecio } from "@/lib/data/productos-temp";

// PLAN.md sección 9.4.1 — antes de tener la dirección del cliente se usa el
// umbral de Lima Metropolitana por defecto (mayor volumen de clientes). Una
// vez el checkout tenga la dirección real, este componente debe recibir el
// monto_min real de la zona (`envio_tarifas`) en vez de la constante de abajo.
const UMBRAL_ENVIO_GRATIS_LIMA = 150;

interface ShippingProgressBarProps {
  subtotal: number;
}

export function ShippingProgressBar({ subtotal }: ShippingProgressBarProps) {
  const progreso = Math.min(subtotal / UMBRAL_ENVIO_GRATIS_LIMA, 1) * 100;
  const faltante = Math.max(UMBRAL_ENVIO_GRATIS_LIMA - subtotal, 0);
  const cumplido = faltante === 0;

  return (
    <div className="rounded-xl bg-soft-gray p-4">
      <div className="flex items-center justify-between font-body text-xs font-bold text-secondary">
        <span>TÚ</span>
        <span>{formatPrecio(UMBRAL_ENVIO_GRATIS_LIMA)}</span>
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
        Envío gratis en Lima Metropolitana desde S/.150 — el monto varía según tu distrito.
      </p>
    </div>
  );
}
