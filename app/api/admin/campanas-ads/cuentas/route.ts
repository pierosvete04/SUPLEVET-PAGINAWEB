import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listarCuentasPublicitarias, metaAdsConfigurado } from "@/lib/meta-ads";

// Refresca `campanas_ads_cuentas` con lo que el token puede ver AHORA MISMO
// en Meta y devuelve la lista guardada (ya con el flag `sincronizar` que el
// admin haya marcado). Así, si se crea una cuenta publicitaria nueva, basta
// con abrir /admin/campanas-ads para que aparezca sola — sin tocar código.
export async function GET() {
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

  if (!metaAdsConfigurado()) {
    return NextResponse.json({ error: "Meta Ads no está configurado (falta META_ADS_ACCESS_TOKEN)." }, { status: 503 });
  }

  try {
    const cuentas = await listarCuentasPublicitarias();
    if (cuentas.length > 0) {
      // No pisa `sincronizar` de cuentas ya conocidas — el upsert solo toca
      // nombre/descubierta_at; el flag lo controla el admin desde el checkbox.
      await supabase.from("campanas_ads_cuentas").upsert(
        cuentas.map((c) => ({ external_id: c.id, plataforma: "meta" as const, nombre: c.nombre, descubierta_at: new Date().toISOString() })),
        { onConflict: "external_id", ignoreDuplicates: false }
      );
    }
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error consultando Meta Ads";
    return NextResponse.json({ error: mensaje }, { status: 502 });
  }

  const { data: guardadas } = await supabase.from("campanas_ads_cuentas").select("*").order("nombre");
  return NextResponse.json({ ok: true, cuentas: guardadas ?? [] });
}
