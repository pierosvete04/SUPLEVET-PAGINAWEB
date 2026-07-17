export interface BandanaRegalo {
  slug: string;
  nombre: string;
  imagen: string;
}

// Diseños fijos de bandana de regalo — no se gestionan desde /admin/regalos
// (esa tabla define el monto mínimo y la vigencia; el diseño de bandana en sí
// es un catálogo cerrado de 4 estampados impresos).
export const BANDANAS_REGALO: BandanaRegalo[] = [
  { slug: "pina", nombre: "Piña", imagen: "/images/regalos/bandana-pina.png" },
  { slug: "palta", nombre: "Palta", imagen: "/images/regalos/bandana-palta.png" },
  { slug: "huesitos", nombre: "Huesitos", imagen: "/images/regalos/bandana-huesitos.png" },
  { slug: "sandia", nombre: "Sandía", imagen: "/images/regalos/bandana-sandia.png" },
];

export function getBandanaRegaloPorSlug(slug: string | null): BandanaRegalo | null {
  if (!slug) return null;
  return BANDANAS_REGALO.find((b) => b.slug === slug) ?? null;
}
