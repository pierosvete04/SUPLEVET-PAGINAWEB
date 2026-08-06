import type { SupabaseClient } from "@supabase/supabase-js";

export type EstadoResena = "pendiente" | "aprobada" | "rechazada";

export interface Resena {
  id: string;
  cliente_id: string;
  pedido_id: string;
  producto_shopify_id: string;
  producto_nombre: string;
  calificacion: number;
  texto: string;
  estado: EstadoResena;
  cliente_nombre: string | null;
  cliente_ciudad: string | null;
  puntos_acreditados: boolean;
  admin_nota: string | null;
  revisado_at: string | null;
  created_at: string;
}

// Testimonio público a partir de una reseña aprobada.
export interface ResenaPublica {
  id: string;
  texto: string;
  calificacion: number;
  cliente_nombre: string | null;
  cliente_ciudad: string | null;
  producto_nombre: string;
}

// `limite` no es un detalle de paginación: el carrusel que consume esto es
// circular e infinito (InfiniteCarousel triplica la lista en el DOM), así que
// cada reseña extra son ~6 iconos SVG × 3 copias que el visitante NUNCA va a
// ver, pero que igual se descargan. Sin límite, las 50 reseñas aprobadas
// generaban 946 SVGs y 1,1 MB de HTML solo en la home.
export async function getResenasAprobadas(
  supabase: SupabaseClient,
  limite?: number
): Promise<ResenaPublica[]> {
  let consulta = supabase
    .from("resenas")
    .select("id, texto, calificacion, cliente_nombre, cliente_ciudad, producto_nombre")
    .eq("estado", "aprobada")
    .order("created_at", { ascending: false });

  if (limite) consulta = consulta.limit(limite);

  const { data } = await consulta;
  return (data as ResenaPublica[]) ?? [];
}

// Reseñas de UN producto específico (página de producto) — a diferencia del
// carrusel público general, acá sí se muestra la calificación.
export interface ResenaProducto {
  id: string;
  texto: string;
  calificacion: number;
  cliente_nombre: string | null;
  cliente_ciudad: string | null;
  created_at: string;
}

export async function getResenasDeProducto(
  supabase: SupabaseClient,
  shopifyProductId: string
): Promise<ResenaProducto[]> {
  const { data } = await supabase
    .from("resenas")
    .select("id, texto, calificacion, cliente_nombre, cliente_ciudad, created_at")
    .eq("producto_shopify_id", shopifyProductId)
    .eq("estado", "aprobada")
    .order("created_at", { ascending: false });
  return (data as ResenaProducto[]) ?? [];
}
