import type { SupabaseClient } from "@supabase/supabase-js";

export interface SuplepuntosCliente {
  cliente_id: string;
  saldo_actual: number;
  puntos_historicos: number;
  nivel: "basico" | "silver" | "gold" | "diamond";
  codigo_referido: string;
  referido_por: string | null;
  total_compras: number | null;
  ultima_compra_at: string | null;
}

export type TipoSuplepuntosConfig =
  | "accion"
  | "canje_descuento"
  | "canje_envio"
  | "canje_producto"
  | "multiplicador";

export interface SuplepuntosConfig {
  id: string;
  tipo: TipoSuplepuntosConfig;
  clave: string;
  nombre: string;
  descripcion: string | null;
  puntos_requeridos: number | null;
  puntos_otorgados: number | null;
  multiplicador: number | null;
  valor_sol: number | null;
  activo: boolean | null;
  limite_por_cliente: number | null;
  limite_periodo: string | null;
  es_lanzamiento: boolean | null;
}

export interface Canje {
  id: string;
  cliente_id: string;
  config_id: string;
  puntos_usados: number;
  estado: string;
  codigo_canje: string | null;
  created_at: string;
}

// Acredita (o descuenta) puntos y registra la transacción — puerto de
// acreditarPuntos() del portal viejo (assets/js/utils.js / mascotas.js).
// No es atómico (dos escrituras separadas), igual que el original.
export async function acreditarPuntos(
  supabase: SupabaseClient,
  clienteId: string,
  accion: string,
  puntos: number,
  descripcion: string,
  pedidoId: string | null = null,
  mascotaId: string | null = null
): Promise<void> {
  const { data: actual } = await supabase
    .from("suplepuntos_clientes")
    .select("saldo_actual, puntos_historicos")
    .eq("cliente_id", clienteId)
    .maybeSingle();

  const saldoAnterior = actual?.saldo_actual ?? 0;
  const saldoNuevo = saldoAnterior + puntos;

  await supabase.from("suplepuntos_transacciones").insert({
    cliente_id: clienteId,
    tipo: puntos >= 0 ? "credito" : "debito",
    accion,
    puntos,
    saldo_anterior: saldoAnterior,
    saldo_nuevo: saldoNuevo,
    pedido_id: pedidoId,
    mascota_id: mascotaId,
    descripcion,
  });

  await supabase
    .from("suplepuntos_clientes")
    .update({
      saldo_actual: saldoNuevo,
      puntos_historicos: puntos > 0 ? (actual?.puntos_historicos ?? 0) + puntos : actual?.puntos_historicos,
    })
    .eq("cliente_id", clienteId);
}
