import { createClient } from "@/lib/supabase/server";
import { getUsuarioSesion } from "@/lib/supabase/usuario";
import { ComunidadFeed } from "@/components/portal/comunidad/ComunidadFeed";

export default async function PortalComunidadPage() {
  const supabase = await createClient();
  const user = await getUsuarioSesion();
  if (!user) return null;

  return <ComunidadFeed user={user} />;
}
