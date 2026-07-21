// Tipos y contenido estático SIN dependencias de servidor — importable desde
// componentes cliente. El catálogo real (precios, stock, imágenes) vive en
// Supabase (`productos_web`, ver lib/data/productos.ts) y se administra desde
// /admin/productos.
export type CategoriaProducto = "producto" | "combo";

// Métodos de pago disponibles en checkout (components/checkout/PaymentStep.tsx)
// — cada producto declara cuáles admite vía metodosPagoPermitidos, editable
// desde /admin/productos.
export type MetodoPago = "tarjeta" | "yape_plin" | "transferencia" | "contra_entrega";

export const TODOS_LOS_METODOS_PAGO: MetodoPago[] = [
  "tarjeta",
  "yape_plin",
  "transferencia",
  "contra_entrega",
];

export const METODO_PAGO_LABEL: Record<MetodoPago, string> = {
  tarjeta: "Tarjeta (Mercado Pago)",
  yape_plin: "Yape / Plin",
  transferencia: "Transferencia bancaria",
  contra_entrega: "Pago contra entrega",
};

// Contra entrega es el único método donde el courier cobra al recibir — el
// resto llega ya pagado/en verificación, así que el rótulo debe decir
// "NO COBRAR" para que el motorizado no cobre dos veces.
export function cobraAlEntregar(formaPago: string | null | undefined): boolean {
  return formaPago === "contra_entrega";
}

export interface ProductoCombo {
  slug: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaProducto;
  precio: number;
  precioComparacion: number;
  imagen: string;
  galeria: string[];
  descuentoPorcentaje: number;
  videos: string[];
  shopifyProductId: string | null;
  metodosPagoPermitidos: MetodoPago[];
}

export function formatPrecio(valor: number): string {
  return `S/.${valor.toFixed(2)}`;
}
