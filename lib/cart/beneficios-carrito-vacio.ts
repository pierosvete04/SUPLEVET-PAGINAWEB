import { Truck, Star, Gift, type LucideIcon } from "lucide-react";

export interface BeneficioCarritoVacio {
  icono: LucideIcon;
  texto: string;
}

// Se muestran en el drawer (CartSheet) y en /carrito solo cuando el carrito
// está vacío — convierten esa pausa en un empujón a comprar en vez de un
// callejón sin salida ("tu carrito está vacío" + botón, sin ningún motivo
// para volver a la tienda).
export const BENEFICIOS_CARRITO_VACIO: BeneficioCarritoVacio[] = [
  { icono: Truck, texto: "Envío gratis en Lima Metropolitana desde S/.150" },
  { icono: Star, texto: "Gana SuplePoints en cada compra y canjéalos por descuentos" },
  { icono: Gift, texto: "Bandana de regalo gratis al llevar cualquier combo" },
];
