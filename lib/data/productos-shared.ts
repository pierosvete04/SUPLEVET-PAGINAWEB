// Tipos y contenido estático SIN dependencias de servidor — importable desde
// componentes cliente. El catálogo real (precios, stock, imágenes) vive en
// Supabase (`productos_web`, ver lib/data/productos.ts) y se administra desde
// /admin/productos.
export type CategoriaProducto = "producto" | "combo";

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
}

export function formatPrecio(valor: number): string {
  return `S/.${valor.toFixed(2)}`;
}
