import { createClient } from "@/lib/supabase/server";
import { ComunidadFeed } from "@/components/portal/comunidad/ComunidadFeed";

export default async function PortalComunidadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return <ComunidadFeed user={user} />;
}
