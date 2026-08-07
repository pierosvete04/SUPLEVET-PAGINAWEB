import { createClient } from "@/lib/supabase/server";
import { getUsuarioSesion } from "@/lib/supabase/usuario";
import { HistoriasViewer } from "@/components/portal/historias/HistoriasViewer";

export default async function PortalHistoriasPage() {
  const supabase = await createClient();
  const user = await getUsuarioSesion();
  if (!user) return null;

  return <HistoriasViewer user={user} />;
}
