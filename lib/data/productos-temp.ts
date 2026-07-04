// Datos de catálogo TEMPORALES — hardcodeados mientras no existan las tablas
// `productos_web` / `productos_web_variantes` en Supabase (PLAN.md sección 8.3,
// Fase 1). Cuando esas tablas existan, este archivo se reemplaza por una
// consulta real y los componentes que lo importan no deberían necesitar cambios
// de forma, solo el origen de los datos.

const STORAGE_BASE =
  "https://bcahhdszzwearqaafhpa.supabase.co/storage/v1/object/public/productos-web-fotos";

export interface ProductoCombo {
  slug: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precioComparacion: number;
  imagen: string;
  descuentoPorcentaje: number;
}

export const combos: ProductoCombo[] = [
  {
    slug: "combo-mix",
    nombre: "Combo Mix (150g + 250g)",
    descripcion: "Una bolsa de cada presentación, ideal para probar y abastecerte.",
    precio: 215.9,
    precioComparacion: 239.89,
    imagen: `${STORAGE_BASE}/combo-mix/hero-estudio.png`,
    descuentoPorcentaje: 10,
  },
  {
    slug: "combo-150g-x2",
    nombre: "Combo 150g x2",
    descripcion: "Dos bolsas de 150g con descuento especial.",
    precio: 169.9,
    precioComparacion: 199.8,
    imagen: `${STORAGE_BASE}/combo-150g-x2/hero-estudio.png`,
    descuentoPorcentaje: 15,
  },
  {
    slug: "combo-250g-x2",
    nombre: "Combo 250g x2",
    descripcion: "Máximo ahorro para el cuidado continuo de tu mascota.",
    precio: 259.9,
    precioComparacion: 279.98,
    imagen: `${STORAGE_BASE}/combo-250g-x2/hero-estudio.png`,
    descuentoPorcentaje: 7,
  },
];

export const presentaciones = {
  g150: {
    nombre: "Suplevet 150g",
    imagen: `${STORAGE_BASE}/suplevet-150g/hero-estudio.png`,
  },
  g250: {
    nombre: "Suplevet 250g",
    imagen: `${STORAGE_BASE}/suplevet-250g/hero-estudio.png`,
  },
};

export function formatPrecio(valor: number): string {
  return `S/.${valor.toFixed(2)}`;
}
