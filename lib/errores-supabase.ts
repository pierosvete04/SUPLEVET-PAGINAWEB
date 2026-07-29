import type { PostgrestError } from "@supabase/supabase-js";

// Traduce los códigos de error más comunes de Postgres/Supabase (ver
// https://www.postgresql.org/docs/current/errcodes-appendix.html) a un
// mensaje en español que un admin sin contexto técnico pueda entender.
// Si el código no está mapeado, se cae al mensaje crudo de Supabase.
const MENSAJE_POR_CODIGO: Record<string, string> = {
  "23505": "Ya existe un registro con ese mismo valor. Usa uno distinto.",
  "23503": "No se puede completar: hace referencia a un dato que no existe o que ya fue eliminado.",
  "23502": "Falta completar un campo obligatorio.",
  "23514": "Alguno de los valores ingresados no es válido.",
  "42501": "No tienes permisos para realizar esta acción.",
};

export function traducirErrorSupabase(
  error: Pick<PostgrestError, "code" | "message"> | null | undefined,
  fallback = "No se pudo guardar. Intenta de nuevo."
): string {
  if (!error) return fallback;
  return MENSAJE_POR_CODIGO[error.code] ?? error.message ?? fallback;
}
