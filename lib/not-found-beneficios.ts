import { Truck, Stethoscope, Coins, Gift, type LucideIcon } from "lucide-react";

export interface BeneficioNotFound {
  icono: LucideIcon;
  titulo: string;
  texto: string;
}

// Se muestran en la página 404 (app/not-found.tsx). La mayoría de quien cae
// ahí llega desde una URL indexada de la tienda anterior en Shopify, que ya
// no existe: no es un usuario perdido dentro del sitio, es alguien con
// intención de compra que se topó con un callejón sin salida. Por eso el 404
// no se limita a "no encontramos la página": recuerda por qué vale la pena
// entrar a la web nueva.
//
// Cada dato debe ser verificable en el sitio:
// - envío gratis desde S/.170 → app/legal/envios (tabla de montos mínimos)
// - SuplePoints → /mi-cuenta y app/legal/reglamento-portal
// - bandana de regalo con combos → lib/regalos.ts y lib/cart/beneficios-carrito-vacio.ts
export const BENEFICIOS_NOT_FOUND: BeneficioNotFound[] = [
  {
    icono: Truck,
    titulo: "Envíos a todo el Perú",
    texto: "Gratis en Lima Metropolitana desde S/.170.",
  },
  {
    icono: Stethoscope,
    titulo: "Respaldo veterinario",
    texto: "Suplemento hiperproteico de uso veterinario, recomendado por especialistas.",
  },
  {
    icono: Coins,
    titulo: "Ganas SuplePoints",
    texto: "Acumulas puntos en cada compra y los canjeas por descuentos.",
  },
  {
    icono: Gift,
    titulo: "Bandana de regalo",
    texto: "Llévate una bandana gratis con cualquier combo.",
  },
];
