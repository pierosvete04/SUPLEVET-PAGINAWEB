import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente con Service Role — bypassa RLS. Server-only: nunca importar desde
// un archivo "use client" ni exponer la clave al navegador. Se usa solo donde
// se necesita leer datos puntuales sin que el visitante tenga sesión propia
// (ej. app/ficha/[id], la ficha pública de una mascota).
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY en las variables de entorno (Project Settings > API en Supabase)."
    );
  }
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
