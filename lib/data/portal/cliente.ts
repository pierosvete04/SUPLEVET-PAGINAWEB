import type { SupabaseClient, User } from "@supabase/supabase-js";

export interface ClientePerfil {
  id: string;
  nombre: string | null;
  apellido: string | null;
  telefono: string | null;
  foto_url: string | null;
  direccion: string | null;
  distrito: string | null;
  ciudad: string | null;
  perfil_completo: boolean | null;
}

function generarCodigoReferido(userId: string): string {
  return `SUPLE-${userId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

// Crea las filas base (clientes_perfil, suplepuntos_clientes) si no existen —
// idempotente y barato (dos upserts "ignora si ya existe"), pensado para
// correr en CADA carga del layout del portal (app/mi-cuenta/(portal)/layout.tsx)
// sin importar cómo se estableció la sesión (login del portal, OTP del
// checkout, etc.) — así nunca falta la fila aunque el login no haya pasado por
// LoginPanel.tsx. No llama a vincular_pedidos_shopify (eso solo corre una vez
// en el login real, ver abajo) para no repetir esa RPC en cada navegación.
export async function asegurarFilasCliente(
  supabase: SupabaseClient,
  userId: string
): Promise<{ esNuevo: boolean }> {
  const { data: perfil } = await supabase
    .from("clientes_perfil")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (!perfil) {
    await supabase.from("clientes_perfil").insert({ id: userId, perfil_completo: false });
  }

  const { data: puntos } = await supabase
    .from("suplepuntos_clientes")
    .select("cliente_id")
    .eq("cliente_id", userId)
    .maybeSingle();

  let esNuevo = false;
  if (!puntos) {
    await supabase.from("suplepuntos_clientes").insert({
      cliente_id: userId,
      codigo_referido: generarCodigoReferido(userId),
      saldo_actual: 0,
      puntos_historicos: 0,
      nivel: "basico",
    });
    esNuevo = true;
  }

  return { esNuevo };
}

// Se ejecuta justo después de un login exitoso (OTP, Google OAuth) — además de
// asegurar las filas, vincula pedidos de Shopify ya realizados con este correo
// (RPC vincular_pedidos_shopify). Puerto de auth.js del portal viejo.
export async function asegurarClienteInicializado(
  supabase: SupabaseClient,
  user: User
): Promise<{ esNuevo: boolean }> {
  const resultado = await asegurarFilasCliente(supabase, user.id);
  await supabase.rpc("vincular_pedidos_shopify");
  return resultado;
}
