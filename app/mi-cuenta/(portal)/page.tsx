import { createClient } from "@/lib/supabase/server";
import { InicioDashboard } from "@/components/portal/inicio/InicioDashboard";
import type { ClientePerfil } from "@/lib/data/portal/cliente";
import { mapaVacunaPendiente } from "@/lib/data/portal/mascotas";

// Todo el contenido inicial (puntos, mascotas, actividad, logros) se resuelve
// acá en paralelo en vez de en el useEffect de InicioDashboard: antes esta
// era la página más visitada del portal y aun así mostraba un loader de
// pantalla completa en cada carga mientras esperaba 5 consultas a Supabase
// desde el cliente. Solo la verificación de logros nuevos (una escritura, no
// una lectura) se queda en el cliente — ver InicioDashboard.tsx.
export default async function PortalInicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: perfil }, { data: puntos }, { data: mascotas }, { data: transacciones }, { data: logros }, { data: logrosGanados }] =
    await Promise.all([
      supabase.from("clientes_perfil").select("*").eq("id", user.id).maybeSingle<ClientePerfil>(),
      supabase.from("suplepuntos_clientes").select("*").eq("cliente_id", user.id).maybeSingle(),
      supabase
        .from("mascotas")
        .select("id, nombre, especie, especie_otro, raza, foto_url, fecha_nacimiento, peso_kg")
        .eq("cliente_id", user.id)
        .order("created_at", { ascending: true })
        .limit(3),
      supabase
        .from("suplepuntos_transacciones")
        .select("id, accion, descripcion, puntos, created_at")
        .eq("cliente_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("logros_config").select("*").eq("activo", true).order("orden", { ascending: true }),
      supabase.from("cliente_logros").select("logro_clave").eq("cliente_id", user.id),
    ]);

  let vacunaPendiente: Record<string, boolean> = {};
  if (mascotas && mascotas.length > 0) {
    const { data: eventos } = await supabase
      .from("mascota_eventos")
      .select("mascota_id, detalle")
      .in(
        "mascota_id",
        mascotas.map((m) => m.id)
      )
      .eq("tipo", "vacuna")
      .order("fecha", { ascending: false });
    vacunaPendiente = mapaVacunaPendiente(eventos ?? []);
  }

  return (
    <InicioDashboard
      user={user}
      perfil={perfil}
      puntosInicial={puntos}
      mascotasIniciales={mascotas ?? []}
      vacunaPendienteInicial={vacunaPendiente}
      transaccionesIniciales={transacciones ?? []}
      logrosIniciales={logros ?? []}
      logrosGanadosIniciales={(logrosGanados ?? []).map((g) => g.logro_clave)}
    />
  );
}
