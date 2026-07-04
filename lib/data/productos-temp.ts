// Datos de catálogo TEMPORALES — hardcodeados mientras no existan las tablas
// `productos_web` / `productos_web_variantes` en Supabase (PLAN.md sección 8.3,
// Fase 1). Cuando esas tablas existan, este archivo se reemplaza por una
// consulta real y los componentes que lo importan no deberían necesitar cambios
// de forma, solo el origen de los datos.

const STORAGE_BASE =
  "https://bcahhdszzwearqaafhpa.supabase.co/storage/v1/object/public/productos-web-fotos";

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
}

export const productos: ProductoCombo[] = [
  {
    slug: "suplevet-150g",
    nombre: "Suplevet 150g",
    descripcion: "Suplemento hiperproteico para uso veterinario.",
    categoria: "producto",
    precio: 99.9,
    precioComparacion: 99.9,
    imagen: `${STORAGE_BASE}/suplevet-150g/hero-estudio.png`,
    galeria: [
      `${STORAGE_BASE}/suplevet-150g/hero-estudio.png`,
      `${STORAGE_BASE}/suplevet-150g/frente.png`,
      `${STORAGE_BASE}/suplevet-150g/reverso.png`,
      `${STORAGE_BASE}/suplevet-150g/lifestyle-perro.jpg`,
    ],
    descuentoPorcentaje: 0,
  },
  {
    slug: "suplevet-250g",
    nombre: "Suplevet 250g",
    descripcion: "Mayor contenido para tratamientos prolongados.",
    categoria: "producto",
    precio: 139.99,
    precioComparacion: 139.99,
    imagen: `${STORAGE_BASE}/suplevet-250g/hero-estudio.png`,
    galeria: [
      `${STORAGE_BASE}/suplevet-250g/hero-estudio.png`,
      `${STORAGE_BASE}/suplevet-250g/frente.png`,
      `${STORAGE_BASE}/suplevet-250g/reverso.png`,
      `${STORAGE_BASE}/suplevet-250g/lifestyle-gato.png`,
    ],
    descuentoPorcentaje: 0,
  },
  {
    slug: "combo-mix",
    nombre: "Combo Mix (150g + 250g)",
    descripcion: "Una bolsa de cada presentación, ideal para probar y abastecerte.",
    categoria: "combo",
    precio: 215.9,
    precioComparacion: 239.89,
    imagen: `${STORAGE_BASE}/combo-mix/hero-estudio.png`,
    galeria: [`${STORAGE_BASE}/combo-mix/hero-estudio.png`],
    descuentoPorcentaje: 10,
  },
  {
    slug: "combo-150g-x2",
    nombre: "Combo 150g x2",
    descripcion: "Dos bolsas de 150g con descuento especial.",
    categoria: "combo",
    precio: 169.9,
    precioComparacion: 199.8,
    imagen: `${STORAGE_BASE}/combo-150g-x2/hero-estudio.png`,
    galeria: [`${STORAGE_BASE}/combo-150g-x2/hero-estudio.png`],
    descuentoPorcentaje: 15,
  },
  {
    slug: "combo-250g-x2",
    nombre: "Combo 250g x2",
    descripcion: "Máximo ahorro para el cuidado continuo de tu mascota.",
    categoria: "combo",
    precio: 259.9,
    precioComparacion: 279.98,
    imagen: `${STORAGE_BASE}/combo-250g-x2/hero-estudio.png`,
    galeria: [`${STORAGE_BASE}/combo-250g-x2/hero-estudio.png`],
    descuentoPorcentaje: 7,
  },
];

export function getProductoBySlug(slug: string): ProductoCombo | undefined {
  return productos.find((p) => p.slug === slug);
}

// Composición — misma fórmula para todas las presentaciones (PLAN.md sección 3).
export interface Ingrediente {
  nombre: string;
  descripcionCorta: string;
}

export const ingredientes: Ingrediente[] = [
  {
    nombre: "Proteína de Suero (Whey Protein)",
    descripcionCorta:
      "Aporta 5.4g de proteína de alto valor biológico por toma. Fundamental para la recuperación y mantenimiento de masa muscular magra.",
  },
  {
    nombre: "Lactoferrina",
    descripcionCorta:
      "Proteína que ayuda a regular la absorción de hierro y apoya activamente las defensas naturales del organismo.",
  },
  {
    nombre: "Calostro Bovino",
    descripcionCorta:
      "Rico en inmunoglobulinas. Contribuye a fortalecer el sistema inmunológico, especialmente en mascotas vulnerables.",
  },
  {
    nombre: "DHA / EPA",
    descripcionCorta:
      "Ácidos grasos Omega-3 esenciales que ayudan a reducir procesos inflamatorios, favorecen la salud cognitiva y un pelaje brillante.",
  },
  {
    nombre: "Prebióticos (FOS)",
    descripcionCorta:
      "Fructooligosacáridos que alimentan la flora intestinal beneficiosa, optimizando la digestión y absorción de nutrientes.",
  },
];

// Tabla comparativa (PLAN.md sección 5.4.3) — sin nombrar marcas de competencia.
export const comparativaFilas = [
  { atributo: "Nutrición funcional (DHA/EPA + prebióticos + calostro)", suplevet: true },
  { atributo: "Uso veterinario, sin azúcares ni gluten añadidos", suplevet: true },
  { atributo: "Apto para perros y gatos, todas las etapas", suplevet: true },
  { atributo: "Producto peruano, registro SENASA", suplevet: true },
];

export const combos = productos.filter((p) => p.categoria === "combo");

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
