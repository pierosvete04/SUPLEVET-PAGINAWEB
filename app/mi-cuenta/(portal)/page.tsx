import { createClient } from "@/lib/supabase/server";
import { InicioDashboard } from "@/components/portal/inicio/InicioDashboard";
import type { ClientePerfil } from "@/lib/data/portal/cliente";

export default async function PortalInicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("clientes_perfil")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<ClientePerfil>();

  return <InicioDashboard user={user} perfil={perfil} />;
}
