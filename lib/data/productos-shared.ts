// Tipos y contenido estático SIN dependencias de servidor — importable desde
// componentes cliente. El catálogo real (precios, stock, imágenes) vive en
// Supabase (`productos_web`, ver lib/data/productos.ts) y se administra desde
// /admin/productos. Lo de acá (ingredientes, comparativa) es contenido de
// marketing fijo, no gestionado por el panel admin.
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

export function formatPrecio(valor: number): string {
  return `S/.${valor.toFixed(2)}`;
}

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
