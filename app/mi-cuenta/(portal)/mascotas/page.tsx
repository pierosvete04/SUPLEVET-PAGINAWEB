import { createClient } from "@/lib/supabase/server";
import { getUsuarioSesion } from "@/lib/supabase/usuario";
import { mapaVacunaPendiente } from "@/lib/data/portal/mascotas";
import { MascotasGrid } from "@/components/portal/mascotas/MascotasGrid";

// Mascotas y el estado "vacuna pendiente" se resuelven acá (servidor) en vez
// de en un useEffect del cliente: antes MascotasGrid mostraba un loader de
// pantalla completa en cada visita mientras esperaba este mismo round-trip a
// Supabase — con esto la lista ya llega renderizada en el HTML inicial.
export default async function PortalMascotasPage() {
  const supabase = await createClient();
  const user = await getUsuarioSesion();
  if (!user) return null;

  // Las dos consultas van EN PARALELO. Antes la de eventos esperaba a la de
  // mascotas porque filtraba por `mascota_id IN (ids)`, y cada viaje a Supabase
  // (us-west-2) cuesta ~400-650 ms desde el origen: esa dependencia era medio
  // segundo de espera pura. Filtrando por `cliente_id` —que mascota_eventos ya
  // tiene— se obtiene exactamente el mismo conjunto sin necesitar los ids antes.
  //
  // Si quedaran eventos de una mascota borrada, mapaVacunaPendiente los indexa
  // por mascota_id y MascotasGrid solo consulta las que muestra, así que sobran
  // sin molestar.
  const [{ data: mascotas }, { data: eventosVacuna }] = await Promise.all([
    supabase
      .from("mascotas")
      .select("*")
      .eq("cliente_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("mascota_eventos")
      .select("mascota_id, detalle")
      .eq("cliente_id", user.id)
      .eq("tipo", "vacuna")
      .order("fecha", { ascending: false }),
  ]);

  return (
    <MascotasGrid
      clienteId={user.id}
      mascotasIniciales={mascotas ?? []}
      vacunaPendienteInicial={mapaVacunaPendiente(eventosVacuna ?? [])}
    />
  );
}
