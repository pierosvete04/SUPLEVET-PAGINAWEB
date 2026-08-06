import type { SupabaseClient } from "@supabase/supabase-js";

export interface ClientePerfil {
  id: string;
  nombre: string | null;
  apellido: string | null;
  telefono: string | null;
  foto_url: string | null;
  direccion: string | null;
  distrito: string | null;
  ciudad: string | null;
  tipo_documento: string | null;
  numero_documento: string | null;
  perfil_completo: boolean | null;
}

export interface SesionCliente {
  /** vendedor/admin: comparte auth.users con los clientes, no es del portal. */
  esInterna: boolean;
  /** Se acaba de crear su fila de SuplePuntos (primer login de verdad). */
  esNuevo: boolean;
  perfilCompleto: boolean;
}

// Un solo round-trip para todo el arranque de sesión del portal: chequea si es
// cuenta interna (vendedor/admin), crea clientes_perfil y suplepuntos_clientes
// si faltan, vincula pedidos previos de Shopify con el mismo correo y devuelve
// perfil_completo. Antes esto eran 5-8 llamadas encadenadas a Supabase (una
// por SELECT/INSERT) y era la causa principal de la demora del login — ver
// migración `inicializar_sesion_cliente_rpc`.
//
// Es idempotente y barato, así que puede correr en CADA carga del layout del
// portal (app/mi-cuenta/(portal)/layout.tsx) sin importar cómo se estableció la
// sesión (login del portal, OTP del checkout, enlace de /auth/confirm).
export async function inicializarSesionCliente(
  supabase: SupabaseClient
): Promise<SesionCliente> {
  const { data, error } = await supabase.rpc("inicializar_sesion_cliente");

  if (error || !data) {
    // Nunca bloqueamos el acceso por esto: el peor caso es que el layout
    // mande a completar perfil, que es idempotente.
    return { esInterna: false, esNuevo: false, perfilCompleto: false };
  }

  const resultado = data as {
    es_interna?: boolean;
    es_nuevo?: boolean;
    perfil_completo?: boolean;
  };

  return {
    esInterna: Boolean(resultado.es_interna),
    esNuevo: Boolean(resultado.es_nuevo),
    perfilCompleto: Boolean(resultado.perfil_completo),
  };
}
