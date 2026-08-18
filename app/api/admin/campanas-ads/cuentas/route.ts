import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listarCuentasPublicitarias as listarCuentasMeta, metaAdsConfigurado } from "@/lib/meta-ads";
import { listarCuentasPublicitarias as listarCuentasTikTok, tiktokAdsConfigurado } from "@/lib/tiktok-ads";

// Refresca `campanas_ads_cuentas` con lo que los tokens configurados pueden
// ver AHORA MISMO (Meta y/o TikTok — cualquiera de las dos que esté
// configurada) y devuelve la lista guardada (ya con el flag `sincronizar`
// que el admin haya marcado). Así, si se crea una cuenta publicitaria
// nueva, basta con abrir /admin/campanas-ads para que aparezca sola.
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

  if (!metaAdsConfigurado() && !tiktokAdsConfigurado()) {
    return NextResponse.json(
      { error: "Ni Meta Ads ni TikTok Ads están configurados — falta el token de al menos una plataforma." },
      { status: 503 }
    );
  }

  const errores: string[] = [];
  const filas: { external_id: string; plataforma: "meta" | "tiktok"; nombre: string; descubierta_at: string }[] = [];

  if (metaAdsConfigurado()) {
    try {
      const cuentas = await listarCuentasMeta();
      filas.push(
        ...cuentas.map((c) => ({
          external_id: c.id,
          plataforma: "meta" as const,
          nombre: c.nombre,
          descubierta_at: new Date().toISOString(),
        }))
      );
    } catch (error: unknown) {
      errores.push(`Meta: ${error instanceof Error ? error.message : "error desconocido"}`);
    }
  }

  if (tiktokAdsConfigurado()) {
    try {
      const cuentas = await listarCuentasTikTok();
      filas.push(
        ...cuentas.map((c) => ({
          external_id: c.id,
          plataforma: "tiktok" as const,
          nombre: c.nombre,
          descubierta_at: new Date().toISOString(),
        }))
      );
    } catch (error: unknown) {
      errores.push(`TikTok: ${error instanceof Error ? error.message : "error desconocido"}`);
    }
  }

  if (filas.length > 0) {
    // No pisa `sincronizar` de cuentas ya conocidas — el upsert solo toca
    // nombre/descubierta_at; el flag lo controla el admin desde el checkbox.
    await supabase.from("campanas_ads_cuentas").upsert(filas, { onConflict: "external_id", ignoreDuplicates: false });
  }

  if (filas.length === 0 && errores.length > 0) {
    return NextResponse.json({ error: errores.join(" · ") }, { status: 502 });
  }

  const { data: guardadas } = await supabase.from("campanas_ads_cuentas").select("*").order("nombre");
  return NextResponse.json({ ok: true, cuentas: guardadas ?? [], errores });
}
