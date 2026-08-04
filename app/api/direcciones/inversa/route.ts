import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { geocodificarInverso, tieneApiKey } from "@/lib/google-places";

// Traduce el pin arrastrado en el mapa a una dirección de texto. Igual que el
// resto de /api/direcciones/*, exige sesión: cada llamada se le factura a la
// cuenta de Google y no puede quedar como endpoint abierto.
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
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }

  try {
    const ubicacion = await geocodificarInverso(lat, lng);
    if (!ubicacion) {
      return NextResponse.json({ error: "No hay una dirección en ese punto" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, ...ubicacion });
  } catch (error: unknown) {
    console.error("Error geocodificando el pin:", error);
    return NextResponse.json({ error: "No pudimos leer la dirección del pin" }, { status: 502 });
  }
}
