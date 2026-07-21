import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { autocompletarDireccion, tieneApiKey } from "@/lib/google-places";

// Proxy de Google Places para el checkout. Exige sesión iniciada por la misma
// razón que /api/documento/consultar: cada búsqueda se factura, así que no
// puede quedar como endpoint abierto.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  if (!tieneApiKey()) {
    // Sin key el checkout sigue funcionando: el cliente escribe su dirección a
    // mano, solo que sin sugerencias ni coordenadas.
    return NextResponse.json({ ok: true, sugerencias: [], sinConfigurar: true });
  }

  const body = await request.json().catch(() => null);
  const texto = typeof body?.texto === "string" ? body.texto.trim() : "";
  const sessionToken = typeof body?.sessionToken === "string" ? body.sessionToken : "";

  // Menos de 4 caracteres no da resultados útiles y sí gasta cuota.
  if (texto.length < 4 || !sessionToken) {
    return NextResponse.json({ ok: true, sugerencias: [] });
  }

  try {
    const sugerencias = await autocompletarDireccion(texto, sessionToken);
    return NextResponse.json({ ok: true, sugerencias });
  } catch (error: unknown) {
    console.error("Error autocompletando dirección:", error);
    return NextResponse.json({ error: "No pudimos buscar direcciones" }, { status: 502 });
  }
}
