import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioSesion } from "@/lib/supabase/usuario";
import { getCursoDetalle, getLeccionesCompletadas } from "@/lib/cursos";
import { CursoDetalleView } from "@/components/portal/cursos/CursoDetalleView";

export default async function PortalCursoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [curso, user] = await Promise.all([getCursoDetalle(supabase, id), getUsuarioSesion()]);

  if (!curso || !user) notFound();

  const todasLasLecciones = curso.modulos.flatMap((m) => m.lecciones.map((l) => l.id));
  const completadas = await getLeccionesCompletadas(supabase, user.id, todasLasLecciones);

  return <CursoDetalleView curso={curso} leccionesCompletadasIniciales={[...completadas]} />;
}
