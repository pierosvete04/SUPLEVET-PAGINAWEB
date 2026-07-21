import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { coordenadasDesdeUrl } from "@/lib/ubicacion";

// Los links que la gente comparte desde el celular son cortos
// (maps.app.goo.gl/XXXX) y no traen coordenadas: hay que seguir el redirect
// para llegar a la URL larga. Eso no se puede hacer desde el navegador por
// CORS, así que se resuelve acá.
const HOSTS_PERMITIDOS = ["maps.app.goo.gl", "goo.gl", "maps.google.com", "www.google.com", "g.co"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: admin } = await supabase
    .from("admins")
    .select("activo")
    .eq("id", user.id)
    .maybeSingle();
  if (!admin?.activo) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";

  // Allowlist de hosts: sin esto el endpoint sería un SSRF (cualquier admin
  // podría hacer que el servidor pegue a una IP interna y ver el resultado).
  let host: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") throw new Error("solo https");
    host = parsed.hostname;
  } catch {
    return NextResponse.json({ error: "No es un link válido" }, { status: 400 });
  }

  if (!HOSTS_PERMITIDOS.includes(host)) {
    return NextResponse.json({ error: "Solo aceptamos links de Google Maps" }, { status: 400 });
  }

  try {
    const r = await fetch(url, { redirect: "follow", cache: "no-store" });
    const coords = coordenadasDesdeUrl(r.url) ?? coordenadasDesdeUrl(await r.text());
    if (!coords) {
      return NextResponse.json({ error: "Ese link no tiene coordenadas" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, ...coords });
  } catch (error: unknown) {
    console.error("Error resolviendo link de Maps:", error);
    return NextResponse.json({ error: "No pudimos abrir ese link" }, { status: 502 });
  }
}
