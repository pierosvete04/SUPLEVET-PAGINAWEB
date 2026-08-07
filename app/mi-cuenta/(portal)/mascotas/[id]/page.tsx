import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioSesion } from "@/lib/supabase/usuario";
import { MascotaDetallePage } from "@/components/portal/mascotas/MascotaDetallePage";

export default async function PortalMascotaDetalleRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getUsuarioSesion();
  if (!user) return null;

  const { data: mascota } = await supabase
    .from("mascotas")
    .select("*")
    .eq("id", id)
    .eq("cliente_id", user.id)
    .maybeSingle();

  if (!mascota) notFound();

  return <MascotaDetallePage clienteId={user.id} mascota={mascota} />;
}
