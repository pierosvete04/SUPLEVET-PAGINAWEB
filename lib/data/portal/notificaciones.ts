import type { SupabaseClient } from "@supabase/supabase-js";

export type TipoNotificacion =
  | "puntos"
  | "logro"
  | "curso"
  | "mascota_vacuna"
  | "mascota_bano"
  | "mascota_evento";

export interface Notificacion {
  id: string;
  cliente_id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  icon: string;
  link: string | null;
  leido: boolean;
  created_at: string;
}

const ICONO_POR_TIPO: Record<TipoNotificacion, string> = {
  puntos: "star",
  logro: "military_tech",
  curso: "school",
  mascota_vacuna: "vaccines",
  mascota_bano: "shower",
  mascota_evento: "event",
};

// Inserta una notificación instantánea para el propio cliente autenticado
// (puntos, logros) — cubierto por la policy "cliente_id = auth.uid()".
export async function crearNotificacion(
  supabase: SupabaseClient,
  clienteId: string,
  tipo: TipoNotificacion,
  titulo: string,
  mensaje: string,
  link: string | null = null
): Promise<void> {
  const { error } = await supabase.from("notificaciones").insert({
    cliente_id: clienteId,
    tipo,
    titulo,
    mensaje,
    icon: ICONO_POR_TIPO[tipo],
    link,
  });
  if (error) {
    console.error(`crearNotificacion: no se pudo insertar (tipo=${tipo}):`, error.message);
  }
}

export async function listarNotificaciones(
  supabase: SupabaseClient,
  clienteId: string,
  limite = 30
): Promise<Notificacion[]> {
  const { data, error } = await supabase
    .from("notificaciones")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error) {
    console.error("listarNotificaciones: no se pudo leer:", error.message);
    return [];
  }
  return data ?? [];
}

export async function contarNoLeidas(supabase: SupabaseClient, clienteId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notificaciones")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", clienteId)
    .eq("leido", false);
  if (error) {
    console.error("contarNoLeidas: no se pudo contar:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function marcarLeida(supabase: SupabaseClient, notificacionId: string): Promise<void> {
  const { error } = await supabase.from("notificaciones").update({ leido: true }).eq("id", notificacionId);
  if (error) {
    console.error("marcarLeida: no se pudo actualizar:", error.message);
  }
}

export async function marcarTodasLeidas(supabase: SupabaseClient, clienteId: string): Promise<void> {
  const { error } = await supabase
    .from("notificaciones")
    .update({ leido: true })
    .eq("cliente_id", clienteId)
    .eq("leido", false);
  if (error) {
    console.error("marcarTodasLeidas: no se pudo actualizar:", error.message);
  }
}
