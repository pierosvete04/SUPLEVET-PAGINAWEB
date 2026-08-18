import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listarCampanias, listarConjuntosAnuncios, metaAdsConfigurado, obtenerInsightsDiarios } from "@/lib/meta-ads";

// Trae campañas + conjuntos de anuncios de Meta y guarda/actualiza su fila en
// `campanas_ads`, más un snapshot de métricas de los últimos 30 días en
// `campanas_ads_metricas_diarias` (día por día, para poder graficar
// tendencia sin volver a pegarle a la API cada vez que alguien abre el panel).
//
// Solo trae la LISTA y las métricas — nunca asigna editor ni toca nada en
// Meta. La asignación la hace el admin a mano después, desde el panel.
const DIAS_HISTORIAL = 30;

function fechaISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

export async function POST() {
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

  const { data: cuentasMarcadas } = await supabase
    .from("campanas_ads_cuentas")
    .select("external_id")
    .eq("sincronizar", true);
  const cuentaIds = (cuentasMarcadas ?? []).map((c) => c.external_id);
  if (cuentaIds.length === 0) {
    return NextResponse.json(
      { error: "No hay ninguna cuenta publicitaria marcada para sincronizar. Elige al menos una arriba." },
      { status: 400 }
    );
  }

  try {
    const [campanias, conjuntos] = await Promise.all([
      listarCampanias(cuentaIds),
      listarConjuntosAnuncios(cuentaIds),
    ]);

    const filas = [
      ...campanias.map((c) => ({
        plataforma: "meta" as const,
        nivel: "campana" as const,
        external_id: c.id,
        campana_external_id: null as string | null,
        nombre: c.nombre,
        estado: c.estado,
        objectId: c.id,
      })),
      ...conjuntos.map((a) => ({
        plataforma: "meta" as const,
        nivel: "conjunto" as const,
        external_id: a.id,
        campana_external_id: a.campanaId,
        nombre: a.nombre,
        estado: a.estado,
        objectId: a.id,
      })),
    ];

    // Upsert por (plataforma, nivel, external_id) — conserva el editor_id y
    // cupon_id ya asignados, el `unique` de la migración se encarga de eso.
    const { data: guardadas, error: upsertError } = await supabase
      .from("campanas_ads")
      .upsert(
        filas.map(({ objectId: _objectId, ...fila }) => ({ ...fila, sincronizado_at: new Date().toISOString() })),
        { onConflict: "plataforma,nivel,external_id" }
      )
      .select("id, external_id");

    if (upsertError || !guardadas) {
      return NextResponse.json({ error: upsertError?.message ?? "No se pudo guardar la sincronización" }, { status: 500 });
    }

    const idPorExternalId = new Map(guardadas.map((g) => [g.external_id, g.id]));
    const hasta = fechaISO(new Date());
    const desde = fechaISO(new Date(Date.now() - DIAS_HISTORIAL * 24 * 60 * 60 * 1000));

    // Las métricas se piden de a una (con desglose diario cada una) para no
    // exceder los límites de la Graph API con un solo insights call
    // multi-objeto — más lento, pero simple y confiable para una
    // sincronización manual, no pensada para correr en cada visita al panel.
    let fallasInsights = 0;
    for (const fila of filas) {
      const campanaAdsId = idPorExternalId.get(fila.external_id);
      if (!campanaAdsId) continue;
      try {
        const insightsPorDia = await obtenerInsightsDiarios(fila.objectId, desde, hasta);
        const filasMetricas = Array.from(insightsPorDia.entries()).map(([fecha, insights]) => ({
          campana_ads_id: campanaAdsId,
          fecha,
          spend: insights.spend,
          impresiones: insights.impresiones,
          clics: insights.clics,
          video_views: insights.videoViews,
          resultados: insights.resultados,
          valor_resultados: insights.valorResultados,
        }));
        if (filasMetricas.length > 0) {
          await supabase
            .from("campanas_ads_metricas_diarias")
            .upsert(filasMetricas, { onConflict: "campana_ads_id,fecha" });
        }
      } catch {
        fallasInsights += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      campanias: campanias.length,
      conjuntos: conjuntos.length,
      fallasInsights,
    });
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error consultando Meta Ads";
    return NextResponse.json({ error: mensaje }, { status: 502 });
  }
}
