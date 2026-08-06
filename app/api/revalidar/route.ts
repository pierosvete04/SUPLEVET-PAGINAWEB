import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TAG_PUBLICO } from "@/lib/data/publico";

// Vacía la caché del contenido público (lib/data/publico.ts).
//
// Existe porque las páginas públicas pasaron a cachearse: sin esto, un cambio
// hecho desde /admin tardaría hasta una hora en verse, y el sitio se edita a
// diario sin deploy — la edición tiene que seguir saliendo al instante. Los
// formularios del panel llaman acá al guardar (ver lib/revalidar-publico.ts).
//
// No lleva secreto en la URL ni variable de entorno: se autentica con la sesión
// del propio panel, que es lo que ya distingue a un admin de cualquier visitante.
// Aun así el peor caso de un abuso sería un vaciado de caché, no una fuga ni una
// escritura — por eso basta con exigir sesión de admin activo y no algo más caro.
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sesión no encontrada" }, { status: 401 });
  }

  const { data: admin } = await supabase
    .from("admins")
    .select("activo")
    .eq("id", user.id)
    .maybeSingle();

  if (!admin?.activo) {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  revalidateTag(TAG_PUBLICO);
  return NextResponse.json({ ok: true });
}
