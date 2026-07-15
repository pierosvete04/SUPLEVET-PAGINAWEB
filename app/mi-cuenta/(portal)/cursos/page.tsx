import { createClient } from "@/lib/supabase/server";
import { getCursosActivos } from "@/lib/cursos";
import { CursosGrid } from "@/components/portal/cursos/CursosGrid";

export default async function PortalCursosPage() {
  const supabase = await createClient();
  const cursos = await getCursosActivos(supabase);
  return <CursosGrid cursos={cursos} />;
}
