import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detalleDireccion, tieneApiKey } from "@/lib/google-places";

// Segunda mitad del flujo de autocompletado: convierte el placeId elegido en
// coordenadas. Va con el mismo sessionToken que la búsqueda para que Google
// cobre las dos llamadas como UNA sesión y no por separado.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  if (!tieneApiKey()) {
    return NextResponse.json({ error: "Búsqueda de direcciones no disponible" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const placeId = typeof body?.placeId === "string" ? body.placeId : "";
  const sessionToken = typeof body?.sessionToken === "string" ? body.sessionToken : "";
  if (!placeId) {
    return NextResponse.json({ error: "placeId requerido" }, { status: 400 });
  }

  try {
    const detalle = await detalleDireccion(placeId, sessionToken);
    if (!detalle) {
      return NextResponse.json({ error: "No pudimos ubicar esa dirección" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, ...detalle });
  } catch (error: unknown) {
    console.error("Error obteniendo detalle de dirección:", error);
    return NextResponse.json({ error: "No pudimos ubicar esa dirección" }, { status: 502 });
  }
}
