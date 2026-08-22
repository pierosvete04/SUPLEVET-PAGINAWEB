import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ERROR_NO_CONFIGURADO,
  generarIdeas,
  googleAdsConfigurado,
  MAX_SEMILLAS,
} from "@/lib/google-ads-keywords";

/**
 * Pide ideas de keywords a Keyword Planner a partir de semillas.
 *
 * No guarda nada: devuelve las ideas para que el admin elija cuáles le
 * sirven. Las que elija se insertan desde el panel con `origen =
 * 'keyword_planner'`. Guardar las cientos de ideas que devuelve Google
 * llenaría la tabla de ruido y arruinaría los contadores del resumen.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: admin } = await supabase.from("admins").select("rol, activo").eq("id", user.id).maybeSingle();
  if (!admin?.activo || !["admin", "superadmin"].includes(admin.rol ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (!googleAdsConfigurado()) {
    return NextResponse.json({ error: ERROR_NO_CONFIGURADO }, { status: 503 });
  }

  let semillas: unknown;
  try {
    ({ semillas } = await request.json());
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  if (!Array.isArray(semillas) || semillas.some((s) => typeof s !== "string")) {
    return NextResponse.json({ error: "Se esperaba `semillas` como lista de texto." }, { status: 400 });
  }

  if (semillas.length === 0) {
    return NextResponse.json({ error: "Escribe al menos una semilla." }, { status: 400 });
  }

  try {
    const ideas = await generarIdeas(semillas as string[]);
    return NextResponse.json({
      ok: true,
      ideas,
      // Se avisa cuando se recortaron semillas para que el admin no crea que
      // Google ignoró parte de lo que escribió.
      recortadas: semillas.length > MAX_SEMILLAS ? semillas.length - MAX_SEMILLAS : 0,
    });
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "error desconocido";
    return NextResponse.json({ error: `Google Ads: ${mensaje}` }, { status: 502 });
  }
}
