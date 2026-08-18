"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { TableCard } from "@/components/admin/table/TableCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ColumnPicker } from "@/components/admin/editores/ColumnPicker";
import { useColumnasVisibles } from "@/hooks/useColumnasVisibles";
import {
  agruparMetricasPorCampana,
  derivarMetricas,
  METRICAS_VACIAS,
  type FilaMetricaDiaria,
  type MetricasAgregadas,
} from "@/lib/meta-ads-metrics";

interface CampanaAds {
  id: string;
  plataforma: "meta" | "tiktok";
  nivel: "campana" | "conjunto";
  nombre: string;
  estado: string | null;
}

interface VentasReales {
  revenue: number;
  pedidos: number;
  /** false = es el total del editor en el periodo, no exclusivo de esta fila. */
  exclusiva: boolean;
}

type ColumnaMetrica =
  | "plataforma"
  | "nivel"
  | "estado"
  | "impresiones"
  | "clics"
  | "ctr"
  | "cpc"
  | "cpm"
  | "videoViews"
  | "resultados"
  | "costoPorResultado"
  | "valorResultados"
  | "roasMeta";

const COLUMNAS_DISPONIBLES: { valor: ColumnaMetrica; label: string }[] = [
  { valor: "plataforma", label: "Plataforma" },
  { valor: "nivel", label: "Nivel" },
  { valor: "estado", label: "Estado" },
  { valor: "impresiones", label: "Impresiones" },
  { valor: "clics", label: "Clics" },
  { valor: "ctr", label: "CTR" },
  { valor: "cpc", label: "CPC" },
  { valor: "cpm", label: "CPM" },
  { valor: "videoViews", label: "Video views" },
  { valor: "resultados", label: "Resultados (plataforma)" },
  { valor: "costoPorResultado", label: "Costo/Resultado" },
  { valor: "valorResultados", label: "Valor resultados (plataforma)" },
  { valor: "roasMeta", label: "ROAS (plataforma)" },
];

const DIAS_VENTANA = 30;
const NIVEL_LABEL: Record<CampanaAds["nivel"], string> = { campana: "Campaña", conjunto: "Conjunto de anuncios" };
const PLATAFORMA_LABEL: Record<CampanaAds["plataforma"], string> = { meta: "Meta", tiktok: "TikTok" };

// Solo lectura: el objetivo es que el editor compare, para cada video/
// campaña suya, TODAS las métricas que reporta Meta/TikTok contra sus
// ventas REALES (por cupón) — nunca sumados, siempre uno al lado del otro.
// Si el admin vinculó cupones específicos a esa campaña, la venta es exacta;
// si no, se muestra el total del periodo con una nota de que no es
// exclusivo de ese video. Gasto/Ventas reales/ROAS real siempre visibles —
// el resto de métricas de la plataforma son elegibles con el selector de
// columnas ("dashboard personalizado").
export function MisCampanas({ editorId, codigosCupon }: { editorId: string; codigosCupon: string[] }) {
  const { visibles: columnasVisibles, toggle: toggleColumna } = useColumnasVisibles<ColumnaMetrica>(
    "mi-panel-analiticas-columnas",
    COLUMNAS_DISPONIBLES.map((c) => c.valor)
  );
  const [campanas, setCampanas] = useState<CampanaAds[]>([]);
  const [metricas, setMetricas] = useState<Map<string, MetricasAgregadas>>(new Map());
  const [ventasPorFila, setVentasPorFila] = useState<Map<string, VentasReales>>(new Map());
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      const supabase = createClient();
      const desde = new Date(Date.now() - DIAS_VENTANA * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const { data: campanasData } = await supabase
        .from("campanas_ads")
        .select("id, plataforma, nivel, nombre, estado")
        .eq("editor_id", editorId)
        .order("nombre");
      const filas = (campanasData as CampanaAds[]) ?? [];
      setCampanas(filas);

      const idsCampanas = filas.map((f) => f.id);

      const [{ data: metricasData }, { data: vinculosData }, { data: pedidosFallback }] = await Promise.all([
        idsCampanas.length > 0
          ? supabase
              .from("campanas_ads_metricas_diarias")
              .select("campana_ads_id, spend, impresiones, clics, video_views, resultados, valor_resultados")
              .in("campana_ads_id", idsCampanas)
              .gte("fecha", desde)
          : Promise.resolve({ data: [] as FilaMetricaDiaria[] }),
        // Un editor puede correr varios cupones dentro de la misma campaña —
        // por eso esto es N a N (campanas_ads_cupones), no un cupon_id único.
        idsCampanas.length > 0
          ? supabase
              .from("campanas_ads_cupones")
              .select("campana_ads_id, cupones(codigo)")
              .in("campana_ads_id", idsCampanas)
          : Promise.resolve({ data: [] as { campana_ads_id: string; cupones: { codigo: string } | null }[] }),
        codigosCupon.length > 0
          ? supabase
              .from("pedidos")
              .select("total")
              .in("codigo_descuento", codigosCupon)
              .eq("anulado", false)
              .gte("created_at", `${desde}T00:00:00`)
          : Promise.resolve({ data: [] as { total: number }[] }),
      ]);

      setMetricas(agruparMetricasPorCampana((metricasData as FilaMetricaDiaria[]) ?? []));

      const vinculos = (vinculosData ?? []) as { campana_ads_id: string; cupones: { codigo: string } | null }[];
      const codigosPorCampana = new Map<string, string[]>();
      for (const v of vinculos) {
        if (!v.cupones?.codigo) continue;
        const actual = codigosPorCampana.get(v.campana_ads_id) ?? [];
        actual.push(v.cupones.codigo);
        codigosPorCampana.set(v.campana_ads_id, actual);
      }

      const fallback = {
        revenue: (pedidosFallback ?? []).reduce((acc, p) => acc + Number(p.total), 0),
        pedidos: (pedidosFallback ?? []).length,
      };

      // Ventas exactas por los cupones vinculados, calculadas todas juntas
      // para no hacer un round-trip por fila.
      const codigosEspecificos = Array.from(new Set(Array.from(codigosPorCampana.values()).flat()));
      const { data: pedidosEspecificos } =
        codigosEspecificos.length > 0
          ? await supabase
              .from("pedidos")
              .select("codigo_descuento, total")
              .in("codigo_descuento", codigosEspecificos)
              .eq("anulado", false)
              .gte("created_at", `${desde}T00:00:00`)
          : { data: [] as { codigo_descuento: string; total: number }[] };

      const ventasPorCodigo = new Map<string, { revenue: number; pedidos: number }>();
      for (const p of pedidosEspecificos ?? []) {
        const actual = ventasPorCodigo.get(p.codigo_descuento) ?? { revenue: 0, pedidos: 0 };
        ventasPorCodigo.set(p.codigo_descuento, { revenue: actual.revenue + Number(p.total), pedidos: actual.pedidos + 1 });
      }

      const ventas = new Map<string, VentasReales>();
      for (const fila of filas) {
        const codigos = codigosPorCampana.get(fila.id) ?? [];
        if (codigos.length > 0) {
          const total = codigos.reduce(
            (acc, codigo) => {
              const v = ventasPorCodigo.get(codigo);
              return { revenue: acc.revenue + (v?.revenue ?? 0), pedidos: acc.pedidos + (v?.pedidos ?? 0) };
            },
            { revenue: 0, pedidos: 0 }
          );
          ventas.set(fila.id, { ...total, exclusiva: true });
        } else {
          ventas.set(fila.id, { ...fallback, exclusiva: false });
        }
      }
      setVentasPorFila(ventas);
      setCargando(false);
    }
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorId, codigosCupon.join(",")]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Mis campañas</h3>
          <p className="text-xs text-muted-foreground">
            Últimos {DIAS_VENTANA} días. Las métricas con &quot;plataforma&quot; las reporta Meta/TikTok — las
            ventas reales salen de tus pedidos, nunca se suman entre sí.
          </p>
        </div>
        <ColumnPicker opciones={COLUMNAS_DISPONIBLES} visibles={columnasVisibles} onToggle={toggleColumna} />
      </div>

      <TableCard badge={<Badge color="gris">{campanas.length}</Badge>}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaña</TableHead>
                {columnasVisibles.has("plataforma") && <TableHead>Plataforma</TableHead>}
                {columnasVisibles.has("nivel") && <TableHead>Nivel</TableHead>}
                {columnasVisibles.has("estado") && <TableHead>Estado</TableHead>}
                <TableHead>Gasto</TableHead>
                {columnasVisibles.has("impresiones") && <TableHead>Impresiones</TableHead>}
                {columnasVisibles.has("clics") && <TableHead>Clics</TableHead>}
                {columnasVisibles.has("ctr") && <TableHead>CTR</TableHead>}
                {columnasVisibles.has("cpc") && <TableHead>CPC</TableHead>}
                {columnasVisibles.has("cpm") && <TableHead>CPM</TableHead>}
                {columnasVisibles.has("videoViews") && <TableHead>Video views</TableHead>}
                {columnasVisibles.has("resultados") && <TableHead>Resultados (plataforma)</TableHead>}
                {columnasVisibles.has("costoPorResultado") && <TableHead>Costo/Resultado</TableHead>}
                {columnasVisibles.has("valorResultados") && <TableHead>Valor resultados (plataforma)</TableHead>}
                {columnasVisibles.has("roasMeta") && <TableHead>ROAS (plataforma)</TableHead>}
                <TableHead>Ventas reales</TableHead>
                <TableHead>ROAS real</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!cargando && campanas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columnasVisibles.size + 3} className="text-center text-muted-foreground">
                    Todavía no tienes campañas asignadas.
                  </TableCell>
                </TableRow>
              )}
              {campanas.map((c) => {
                const m = metricas.get(c.id) ?? METRICAS_VACIAS;
                const d = derivarMetricas(m);
                const v = ventasPorFila.get(c.id) ?? { revenue: 0, pedidos: 0, exclusiva: false };
                const roasReal = m.spend > 0 ? v.revenue / m.spend : null;
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="font-medium">{c.nombre}</p>
                    </TableCell>
                    {columnasVisibles.has("plataforma") && <TableCell>{PLATAFORMA_LABEL[c.plataforma]}</TableCell>}
                    {columnasVisibles.has("nivel") && <TableCell>{NIVEL_LABEL[c.nivel]}</TableCell>}
                    {columnasVisibles.has("estado") && <TableCell className="text-muted-foreground">{c.estado ?? "—"}</TableCell>}
                    <TableCell>S/.{m.spend.toFixed(2)}</TableCell>
                    {columnasVisibles.has("impresiones") && (
                      <TableCell className="text-muted-foreground">{m.impresiones.toLocaleString("es-PE")}</TableCell>
                    )}
                    {columnasVisibles.has("clics") && (
                      <TableCell className="text-muted-foreground">{m.clics.toLocaleString("es-PE")}</TableCell>
                    )}
                    {columnasVisibles.has("ctr") && (
                      <TableCell className="text-muted-foreground">{d.ctr === null ? "—" : `${d.ctr.toFixed(2)}%`}</TableCell>
                    )}
                    {columnasVisibles.has("cpc") && (
                      <TableCell className="text-muted-foreground">{d.cpc === null ? "—" : `S/.${d.cpc.toFixed(2)}`}</TableCell>
                    )}
                    {columnasVisibles.has("cpm") && (
                      <TableCell className="text-muted-foreground">{d.cpm === null ? "—" : `S/.${d.cpm.toFixed(2)}`}</TableCell>
                    )}
                    {columnasVisibles.has("videoViews") && (
                      <TableCell className="text-muted-foreground">{m.videoViews.toLocaleString("es-PE")}</TableCell>
                    )}
                    {columnasVisibles.has("resultados") && <TableCell className="text-muted-foreground">{m.resultados}</TableCell>}
                    {columnasVisibles.has("costoPorResultado") && (
                      <TableCell className="text-muted-foreground">
                        {d.costoPorResultado === null ? "—" : `S/.${d.costoPorResultado.toFixed(2)}`}
                      </TableCell>
                    )}
                    {columnasVisibles.has("valorResultados") && (
                      <TableCell className="text-muted-foreground">S/.{m.valorResultados.toFixed(2)}</TableCell>
                    )}
                    {columnasVisibles.has("roasMeta") && (
                      <TableCell className="text-muted-foreground">{d.roasMeta === null ? "—" : `${d.roasMeta.toFixed(2)}x`}</TableCell>
                    )}
                    <TableCell>
                      <p>
                        S/.{v.revenue.toFixed(2)} ({v.pedidos})
                      </p>
                      {!v.exclusiva && (
                        <p className="text-xs text-muted-foreground">Total del periodo, no exclusivo de este video</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {roasReal === null ? (
                        "—"
                      ) : (
                        <Badge color={roasReal >= 1 ? "verde" : "naranja"}>{roasReal.toFixed(2)}x</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </TableCard>
    </div>
  );
}
