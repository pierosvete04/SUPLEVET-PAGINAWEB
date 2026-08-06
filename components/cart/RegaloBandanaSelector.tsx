"use client";

import { useCart } from "@/lib/cart/CartContext";
import { SelectorRegaloBandanas } from "@/components/regalos/SelectorRegaloBandanas";

interface RegaloBandanaSelectorProps {
  variant?: "carrito" | "checkout";
  onSlotsRequeridos?: (n: number) => void;
}

// Envoltorio del selector de bandanas conectado al carrito. La UI y las reglas
// de qué regalo aplica viven en SelectorRegaloBandanas, que también usa
// /admin/pedidos/nuevo — así una venta cargada a mano ofrece exactamente los
// mismos regalos que la web, sin una segunda copia de la lógica.
export function RegaloBandanaSelector({ variant = "carrito", onSlotsRequeridos }: RegaloBandanaSelectorProps) {
  const { subtotal, combosQty, bandanasSeleccionadas, setBandanaEnSlot } = useCart();

  return (
    <SelectorRegaloBandanas
      subtotal={subtotal}
      combosQty={combosQty}
      selecciones={bandanasSeleccionadas}
      onCambiarSlot={setBandanaEnSlot}
      variant={variant}
      onSlotsRequeridos={onSlotsRequeridos}
    />
  );
}
