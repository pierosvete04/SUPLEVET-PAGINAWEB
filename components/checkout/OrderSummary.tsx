import Image from "next/image";
import type { CartItem } from "@/lib/cart/CartContext";
import { formatPrecio } from "@/lib/data/productos-temp";

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  envio?: number | null;
}

export function OrderSummary({ items, subtotal, envio }: OrderSummaryProps) {
  const total = subtotal + (envio ?? 0);

  return (
    <div className="rounded-xl border border-border p-5">
      <h3 className="font-body text-sm font-bold uppercase tracking-wide text-secondary">
        Resumen de compra
      </h3>
      <div className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.slug} className="flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-soft-gray">
              <Image src={item.imagen} alt={item.nombre} fill className="object-cover" sizes="48px" />
            </div>
            <div className="flex-1 font-body text-xs text-secondary">
              <p className="font-bold">{item.nombre}</p>
              <p className="text-muted-foreground">Cantidad: {item.cantidad}</p>
            </div>
            <span className="font-body text-sm font-bold text-secondary">
              {formatPrecio(item.precio * item.cantidad)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4 font-body text-sm text-secondary">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrecio(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Envío</span>
          <span>{envio == null ? "—" : envio === 0 ? "Gratis" : formatPrecio(envio)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-border pt-2 font-bold">
          <span>Total</span>
          <span className="text-primary">{formatPrecio(total)}</span>
        </div>
      </div>
    </div>
  );
}
