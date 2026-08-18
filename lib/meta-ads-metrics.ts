// Compartido entre /admin/campanas-ads (todas las campañas) y
// /admin/mi-panel/analiticas (las de un editor) — mismo criterio en los dos:
// solo se suman los valores ADITIVOS (gasto, impresiones, clics, video
// views, resultados, valor de resultados); CTR/CPC/CPM se recalculan a
// partir de esa suma, nunca sumando directamente los % o promedios diarios
// que devuelve Meta (sumar tasas de días distintos da un número sin sentido).
export interface MetricasAgregadas {
  spend: number;
  impresiones: number;
  clics: number;
  videoViews: number;
  resultados: number;
  valorResultados: number;
}

export const METRICAS_VACIAS: MetricasAgregadas = {
  spend: 0,
  impresiones: 0,
  clics: 0,
  videoViews: 0,
  resultados: 0,
  valorResultados: 0,
};

export function sumarMetricas(a: MetricasAgregadas, b: MetricasAgregadas): MetricasAgregadas {
  return {
    spend: a.spend + b.spend,
    impresiones: a.impresiones + b.impresiones,
    clics: a.clics + b.clics,
    videoViews: a.videoViews + b.videoViews,
    resultados: a.resultados + b.resultados,
    valorResultados: a.valorResultados + b.valorResultados,
  };
}

export interface MetricasDerivadas {
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  costoPorResultado: number | null;
  roasMeta: number | null;
}

export function derivarMetricas(m: MetricasAgregadas): MetricasDerivadas {
  return {
    ctr: m.impresiones > 0 ? (m.clics / m.impresiones) * 100 : null,
    cpc: m.clics > 0 ? m.spend / m.clics : null,
    cpm: m.impresiones > 0 ? (m.spend / m.impresiones) * 1000 : null,
    costoPorResultado: m.resultados > 0 ? m.spend / m.resultados : null,
    roasMeta: m.spend > 0 ? m.valorResultados / m.spend : null,
  };
}

/** Fila con forma { campana_ads_id, spend, impresiones, clics, video_views, resultados, valor_resultados } tal cual sale de Supabase. */
export interface FilaMetricaDiaria {
  campana_ads_id: string;
  spend: number;
  impresiones: number;
  clics: number;
  video_views: number;
  resultados: number;
  valor_resultados: number;
}

export function agruparMetricasPorCampana(filas: FilaMetricaDiaria[]): Map<string, MetricasAgregadas> {
  const agregadas = new Map<string, MetricasAgregadas>();
  for (const m of filas) {
    const actual = agregadas.get(m.campana_ads_id) ?? METRICAS_VACIAS;
    agregadas.set(
      m.campana_ads_id,
      sumarMetricas(actual, {
        spend: Number(m.spend),
        impresiones: m.impresiones,
        clics: m.clics,
        videoViews: m.video_views,
        resultados: m.resultados,
        valorResultados: Number(m.valor_resultados),
      })
    );
  }
  return agregadas;
}
