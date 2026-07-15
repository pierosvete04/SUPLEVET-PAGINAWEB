import { createClient } from "@/lib/supabase/server";
import { PuntosDashboard } from "@/components/portal/puntos/PuntosDashboard";

export default async function PortalPuntosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return <PuntosDashboard user={user} />;
}
