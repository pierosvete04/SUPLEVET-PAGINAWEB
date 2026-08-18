import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  listarCampanias as listarCampaniasMeta,
  listarConjuntosAnuncios as listarConjuntosMeta,
  metaAdsConfigurado,
  obtenerInsightsDiarios as obtenerInsightsDiariosMeta,
} from "@/lib/meta-ads";
import {
  listarCampanias as listarCampaniasTikTok,
  listarConjuntosAnuncios as listarConjuntosTikTok,
  obtenerInsightsDiariosPorCuenta,
  tiktokAdsConfigurado,
} from "@/lib/tiktok-ads";

// Trae campañas + conjuntos de anuncios de Meta y/o TikTok (según qué
// cuentas estén marcadas "sincronizar") y guarda/actualiza su fila en
// `campanas_ads`, más un snapshot de métricas de los últimos 30 días en
// `campanas_ads_metricas_diarias` (día por día, para poder graficar
// tendencia sin volver a pegarle a la API cada vez que alguien abre el panel).
//
// Solo trae la LISTA y las métricas — nunca asigna editor ni toca nada en
// Meta/TikTok. La asignación la hace el admin a mano después, desde el panel.
const DIAS_HISTORIAL = 30;

interface FilaCampana {
  plataforma: "meta" | "tiktok";
  nivel: "campana" | "conjunto";
  external_id: string;
  campana_external_id: string | null;
  cuenta_external_id: string;
  nombre: string;
  estado: string;
}

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

  if (!metaAdsConfigurado() && !tiktokAdsConfigurado()) {
    return NextResponse.json(
      { error: "Ni Meta Ads ni TikTok Ads están configurados — falta el token de al menos una plataforma." },
      { status: 503 }
    );
  }

  const { data: cuentasMarcadas } = await supabase
    .from("campanas_ads_cuentas")
    .select("external_id, plataforma")
    .eq("sincronizar", true);
  const cuentaIdsMeta = (cuentasMarcadas ?? []).filter((c) => c.plataforma === "meta").map((c) => c.external_id);
  const cuentaIdsTikTok = (cuentasMarcadas ?? []).filter((c) => c.plataforma === "tiktok").map((c) => c.external_id);
  if (cuentaIdsMeta.length === 0 && cuentaIdsTikTok.length === 0) {
    return NextResponse.json(
      { error: "No hay ninguna cuenta publicitaria marcada para sincronizar. Elige al menos una arriba." },
      { status: 400 }
    );
  }

  try {
    const filas: FilaCampana[] = [];

    if (metaAdsConfigurado() && cuentaIdsMeta.length > 0) {
      const [campanias, conjuntos] = await Promise.all([
        listarCampaniasMeta(cuentaIdsMeta),
        listarConjuntosMeta(cuentaIdsMeta),
      ]);
      filas.push(
        ...campanias.map((c) => ({
          plataforma: "meta" as const,
          nivel: "campana" as const,
          external_id: c.id,
          campana_external_id: null,
          cuenta_external_id: c.cuentaId,
          nombre: c.nombre,
          estado: c.estado,
        })),
        ...conjuntos.map((a) => ({
          plataforma: "meta" as const,
          nivel: "conjunto" as const,
          external_id: a.id,
          campana_external_id: a.campanaId,
          cuenta_external_id: a.cuentaId,
          nombre: a.nombre,
          estado: a.estado,
        }))
      );
    }

    if (tiktokAdsConfigurado() && cuentaIdsTikTok.length > 0) {
      const [campanias, conjuntos] = await Promise.all([
        listarCampaniasTikTok(cuentaIdsTikTok),
        listarConjuntosTikTok(cuentaIdsTikTok),
      ]);
      filas.push(
        ...campanias.map((c) => ({
          plataforma: "tiktok" as const,
          nivel: "campana" as const,
          external_id: c.id,
          campana_external_id: null,
          cuenta_external_id: c.cuentaId,
          nombre: c.nombre,
          estado: c.estado,
        })),
        ...conjuntos.map((a) => ({
          plataforma: "tiktok" as const,
          nivel: "conjunto" as const,
          external_id: a.id,
          campana_external_id: a.campanaId,
          cuenta_external_id: a.cuentaId,
          nombre: a.nombre,
          estado: a.estado,
        }))
      );
    }

    // Upsert por (plataforma, nivel, external_id) — conserva el editor_id ya
    // asignado (los cupones vinculados viven aparte, en
    // campanas_ads_cupones, así que ni se tocan acá), el `unique` de la
    // migración se encarga de eso.
    const { data: guardadas, error: upsertError } = await supabase
      .from("campanas_ads")
      .upsert(
        filas.map((fila) => ({ ...fila, sincronizado_at: new Date().toISOString() })),
        { onConflict: "plataforma,nivel,external_id" }
      )
      .select("id, plataforma, external_id");

    if (upsertError || !guardadas) {
      return NextResponse.json({ error: upsertError?.message ?? "No se pudo guardar la sincronización" }, { status: 500 });
    }

    const idPorExternalId = new Map(guardadas.map((g) => [`${g.plataforma}:${g.external_id}`, g.id]));
    const hasta = fechaISO(new Date());
    const desde = fechaISO(new Date(Date.now() - DIAS_HISTORIAL * 24 * 60 * 60 * 1000));

    async function guardarMetricas(campanaAdsId: string, filasMetricas: Record<string, unknown>[]) {
      if (filasMetricas.length === 0) return;
      await supabase
        .from("campanas_ads_metricas_diarias")
        .upsert(
          filasMetricas.map((m) => ({ ...m, campana_ads_id: campanaAdsId })),
          { onConflict: "campana_ads_id,fecha" }
        );
    }

    let fallasInsights = 0;

    // Meta: las métricas se piden de a una (con desglose diario cada una) —
    // el endpoint de insights cuelga de la ruta de cada objeto, no hay forma
    // de pedir varios a la vez.
    for (const fila of filas.filter((f) => f.plataforma === "meta")) {
      const campanaAdsId = idPorExternalId.get(`meta:${fila.external_id}`);
      if (!campanaAdsId) continue;
      try {
        const insightsPorDia = await obtenerInsightsDiariosMeta(fila.external_id, desde, hasta);
        await guardarMetricas(
          campanaAdsId,
          Array.from(insightsPorDia.entries()).map(([fecha, insights]) => ({
            fecha,
            spend: insights.spend,
            impresiones: insights.impresiones,
            clics: insights.clics,
            video_views: insights.videoViews,
            resultados: insights.resultados,
            valor_resultados: insights.valorResultados,
          }))
        );
      } catch {
        fallasInsights += 1;
      }
    }

    // TikTok: un solo reporte por (cuenta, nivel) trae las métricas de TODAS
    // sus campañas/conjuntos a la vez — más eficiente que pedirlas una por una.
    const combosTikTok = new Set(
      filas.filter((f) => f.plataforma === "tiktok").map((f) => `${f.cuenta_external_id}:${f.nivel}`)
    );
    for (const combo of combosTikTok) {
      const [cuentaId, nivel] = combo.split(":") as [string, "campana" | "conjunto"];
      try {
        const porObjeto = await obtenerInsightsDiariosPorCuenta(cuentaId, nivel, desde, hasta);
        for (const [objectId, insightsPorDia] of porObjeto.entries()) {
          const campanaAdsId = idPorExternalId.get(`tiktok:${objectId}`);
          if (!campanaAdsId) continue;
          await guardarMetricas(
            campanaAdsId,
            Array.from(insightsPorDia.entries()).map(([fecha, insights]) => ({
              fecha,
              spend: insights.spend,
              impresiones: insights.impresiones,
              clics: insights.clics,
              video_views: insights.videoViews,
              resultados: insights.resultados,
              valor_resultados: insights.valorResultados,
            }))
          );
        }
      } catch {
        fallasInsights += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      campanias: filas.filter((f) => f.nivel === "campana").length,
      conjuntos: filas.filter((f) => f.nivel === "conjunto").length,
      fallasInsights,
    });
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error consultando Meta/TikTok Ads";
    return NextResponse.json({ error: mensaje }, { status: 502 });
  }
}
