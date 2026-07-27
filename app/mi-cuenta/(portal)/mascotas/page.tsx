import { createClient } from "@/lib/supabase/server";
import { mapaVacunaPendiente } from "@/lib/data/portal/mascotas";
import { MascotasGrid } from "@/components/portal/mascotas/MascotasGrid";

// Mascotas y el estado "vacuna pendiente" se resuelven acá (servidor) en vez
// de en un useEffect del cliente: antes MascotasGrid mostraba un loader de
// pantalla completa en cada visita mientras esperaba este mismo round-trip a
// Supabase — con esto la lista ya llega renderizada en el HTML inicial.
export default async function PortalMascotasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: mascotas } = await supabase
    .from("mascotas")
    .select("*")
    .eq("cliente_id", user.id)
    .order("created_at", { ascending: true });

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
    <MascotasGrid clienteId={user.id} mascotasIniciales={mascotas ?? []} vacunaPendienteInicial={vacunaPendiente} />
  );
}
