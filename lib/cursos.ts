import type { SupabaseClient } from "@supabase/supabase-js";

export type TipoCurso = "video" | "articulo";
export type TipoRecurso = "lectura" | "descargable";

export interface Curso {
  id: string;
  titulo: string;
  tipo: TipoCurso;
  video_url: string | null;
  contenido: string | null;
  thumbnail_url: string | null;
  orden: number;
  activo: boolean;
  created_at: string;
  categoria: string | null;
  descripcion: string | null;
  duracion_min: number | null;
  es_gratis: boolean;
  nivel: string | null;
  etiqueta: string | null;
  puntos_curso: number;
}

export interface CursoLeccion {
  id: string;
  modulo_id: string;
  titulo: string;
  tipo: TipoCurso;
  video_url: string | null;
  contenido: string | null;
  duracion_min: number | null;
  orden: number;
}

export interface CursoModulo {
  id: string;
  curso_id: string;
  titulo: string;
  orden: number;
  lecciones: CursoLeccion[];
}

export interface CursoRecurso {
  id: string;
  curso_id: string;
  titulo: string;
  tipo: TipoRecurso;
  url: string | null;
  duracion_min: number | null;
  orden: number;
}

export interface CursoDetalle extends Curso {
  modulos: CursoModulo[];
  recursos: CursoRecurso[];
}

export async function getCursosActivos(supabase: SupabaseClient): Promise<Curso[]> {
  const { data } = await supabase.from("cursos").select("*").eq("activo", true).order("orden", { ascending: true });
  return (data as Curso[]) ?? [];
}

export async function getCursoDetalle(supabase: SupabaseClient, cursoId: string): Promise<CursoDetalle | null> {
  const [{ data: curso }, { data: modulos }, { data: recursos }] = await Promise.all([
    supabase.from("cursos").select("*").eq("id", cursoId).maybeSingle(),
    supabase
      .from("curso_modulos")
      .select("*, curso_lecciones(*)")
      .eq("curso_id", cursoId)
      .order("orden", { ascending: true }),
    supabase.from("curso_recursos").select("*").eq("curso_id", cursoId).order("orden", { ascending: true }),
  ]);
  if (!curso) return null;

  const modulosOrdenados: CursoModulo[] = (modulos ?? []).map((m) => ({
    id: m.id,
    curso_id: m.curso_id,
    titulo: m.titulo,
    orden: m.orden,
    lecciones: ((m.curso_lecciones ?? []) as CursoLeccion[]).slice().sort((a, b) => a.orden - b.orden),
  }));

  return { ...(curso as Curso), modulos: modulosOrdenados, recursos: (recursos as CursoRecurso[]) ?? [] };
}

export async function getLeccionesCompletadas(
  supabase: SupabaseClient,
  clienteId: string,
  leccionIds: string[]
): Promise<Set<string>> {
  if (leccionIds.length === 0) return new Set();
  const { data } = await supabase
    .from("cliente_leccion_progreso")
    .select("leccion_id")
    .eq("cliente_id", clienteId)
    .in("leccion_id", leccionIds);
  return new Set((data ?? []).map((r) => r.leccion_id as string));
}

export async function marcarLeccionCompletada(
  supabase: SupabaseClient,
  clienteId: string,
  leccionId: string
): Promise<void> {
  await supabase.from("cliente_leccion_progreso").upsert({ cliente_id: clienteId, leccion_id: leccionId });
}
