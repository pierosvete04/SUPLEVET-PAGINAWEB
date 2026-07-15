import type { SupabaseClient } from "@supabase/supabase-js";

export interface Regalo {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
  condicion_tipo: "monto_minimo" | "producto_especifico";
  condicion_monto_minimo: number | null;
  condicion_producto_slug: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activo: boolean;
}

function estaVigente(regalo: Regalo, hoy: string): boolean {
  if (regalo.fecha_inicio && regalo.fecha_inicio > hoy) return false;
  if (regalo.fecha_fin && regalo.fecha_fin < hoy) return false;
  return true;
}

// Regalos activos y vigentes que aplican a este producto — por monto mínimo
// (aplica a cualquier producto) o por ser justo el producto configurado. Se
// activan/crean desde /admin/regalos (PLAN.md sección 5.4.1) — sin regalos
// activos, este banner simplemente no se muestra en la ficha de producto.
export async function getRegalosAplicables(
  supabase: SupabaseClient,
  productoSlug: string
): Promise<Regalo[]> {
  const { data } = await supabase.from("regalos").select("*").eq("activo", true);
  const hoy = new Date().toISOString().slice(0, 10);
  return ((data as Regalo[]) ?? []).filter(
    (r) =>
      estaVigente(r, hoy) &&
      (r.condicion_tipo === "monto_minimo" || r.condicion_producto_slug === productoSlug)
  );
}

// Usado en el carrito (CartSheet) — no depende de un producto en particular,
// solo del subtotal, así que solo mira regalos por monto mínimo.
export async function getRegalosPorMontoMinimo(supabase: SupabaseClient): Promise<Regalo[]> {
  const { data } = await supabase
    .from("regalos")
    .select("*")
    .eq("activo", true)
    .eq("condicion_tipo", "monto_minimo");
  const hoy = new Date().toISOString().slice(0, 10);
  return ((data as Regalo[]) ?? []).filter((r) => estaVigente(r, hoy));
}
