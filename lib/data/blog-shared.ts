// Tipos y helpers del blog SIN dependencias de servidor (next/headers) —
// importable tanto desde Server Components (lib/data/blog.ts) como desde
// componentes cliente del panel admin, que no pueden cargar lib/supabase/server.
export interface BlogFaq {
  pregunta: string;
  respuesta: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  titulo: string;
  fecha_publicacion: string;
  contenido_html: string;
  resumen: string | null;
  imagen_destacada: string | null;
  autor: string | null;
  estado: "borrador" | "publicado";
  producto_slug: string | null;
  meta_title: string | null;
  meta_description: string | null;
  /** Preguntas frecuentes del artículo. Alimenta el acordeón visible en la
   * página Y el FAQPage JSON-LD (ver lib/schema-faq.ts) — mismo contenido en
   * ambos lugares, como exige Google para datos estructurados. */
  faqs: BlogFaq[];
}

export function formatFechaPost(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
