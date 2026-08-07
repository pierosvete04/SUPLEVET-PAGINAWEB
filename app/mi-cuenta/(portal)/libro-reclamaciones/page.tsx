import { createClient } from "@/lib/supabase/server";
import { getUsuarioSesion } from "@/lib/supabase/usuario";
import { LibroReclamacionesForm } from "@/components/portal/libro/LibroReclamacionesForm";
import type { ClientePerfil } from "@/lib/data/portal/cliente";

export default async function PortalLibroReclamacionesPage() {
  const supabase = await createClient();
  const user = await getUsuarioSesion();

  const { data: perfil } = user
    ? await supabase.from("clientes_perfil").select("*").eq("id", user.id).maybeSingle<ClientePerfil>()
    : { data: null };

  return <LibroReclamacionesForm user={user} perfil={perfil} />;
}
