import { createClient } from "@/lib/supabase/server";
import { PuntosDashboard, type CanjeConNombre } from "@/components/portal/puntos/PuntosDashboard";

// Las 5 consultas que antes vivían en el useEffect de PuntosDashboard se
// resuelven acá en paralelo — esta es la página del saldo/canjes, enlazada
// desde el badge del sidebar, y mostraba un loader de pantalla completa en
// cada visita mientras esperaba ese mismo round-trip desde el cliente.
export default async function PortalPuntosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: puntos }, { data: canjes }, { data: formasGanar }, { data: historial }, { data: misCodigos }] =
    await Promise.all([
      supabase.from("suplepuntos_clientes").select("*").eq("cliente_id", user.id).maybeSingle(),
      supabase
        .from("suplepuntos_config")
        .select("*")
        .eq("activo", true)
        .in("tipo", ["canje_descuento", "canje_envio", "canje_producto"])
        .order("puntos_requeridos", { ascending: true }),
      supabase
        .from("suplepuntos_config")
        .select("*")
        .eq("activo", true)
        .eq("tipo", "accion")
        .order("puntos_otorgados", { ascending: false }),
      supabase
        .from("suplepuntos_transacciones")
        .select("id, accion, descripcion, puntos, created_at")
        .eq("cliente_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("canjes")
        .select("id, codigo_canje, estado, puntos_usados, created_at, suplepuntos_config(nombre)")
        .eq("cliente_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

  return (
    <PuntosDashboard
      user={user}
      puntosInicial={puntos}
      canjesIniciales={canjes ?? []}
      formasGanarIniciales={formasGanar ?? []}
      historialInicial={historial ?? []}
      misCodigosIniciales={(misCodigos as unknown as CanjeConNombre[]) ?? []}
    />
  );
}
