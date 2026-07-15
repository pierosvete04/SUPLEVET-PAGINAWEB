import { createClient } from "@/lib/supabase/server";
import { HistoriasViewer } from "@/components/portal/historias/HistoriasViewer";

export default async function PortalHistoriasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return <HistoriasViewer user={user} />;
}
