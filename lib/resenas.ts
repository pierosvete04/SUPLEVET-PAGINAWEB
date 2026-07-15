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

export async function getResenasAprobadas(supabase: SupabaseClient): Promise<ResenaPublica[]> {
  const { data } = await supabase
    .from("resenas")
    .select("id, texto, calificacion, cliente_nombre, cliente_ciudad, producto_nombre")
    .eq("estado", "aprobada")
    .order("created_at", { ascending: false });
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
