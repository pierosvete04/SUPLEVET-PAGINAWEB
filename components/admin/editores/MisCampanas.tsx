"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { TableCard } from "@/components/admin/table/TableCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CampanaAds {
  id: string;
  plataforma: "meta" | "tiktok";
  nivel: "campana" | "conjunto";
  nombre: string;
  estado: string | null;
  cupon_id: string | null;
}

interface VentasReales {
  revenue: number;
  pedidos: number;
  /** false = es el total del editor en el periodo, no exclusivo de esta fila. */
  exclusiva: boolean;
}

const DIAS_VENTANA = 30;
const NIVEL_LABEL: Record<CampanaAds["nivel"], string> = { campana: "Campaña", conjunto: "Conjunto de anuncios" };
const PLATAFORMA_LABEL: Record<CampanaAds["plataforma"], string> = { meta: "Meta", tiktok: "TikTok" };

// Solo lectura: el objetivo es que el editor compare, para cada video/
// campaña suya, lo que Meta/TikTok reporta contra sus ventas REALES (por
// cupón) — nunca sumados, siempre uno al lado del otro. Si el admin vinculó
// un cupón específico a esa campaña, la venta es exacta; si no, se muestra
// el total del periodo con una nota de que no es exclusivo de ese video.
export function MisCampanas({ editorId, codigosCupon }: { editorId: string; codigosCupon: string[] }) {
  const [campanas, setCampanas] = useState<CampanaAds[]>([]);
  const [metricas, setMetricas] = useState<Map<string, { spend: number; resultados: number }>>(new Map());
  const [ventasPorFila, setVentasPorFila] = useState<Map<string, VentasReales>>(new Map());
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      const supabase = createClient();
      const desde = new Date(Date.now() - DIAS_VENTANA * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const { data: campanasData } = await supabase
        .from("campanas_ads")
        .select("id, plataforma, nivel, nombre, estado, cupon_id")
        .eq("editor_id", editorId)
        .order("nombre");
      const filas = (campanasData as CampanaAds[]) ?? [];
      setCampanas(filas);

      const idsCampanas = filas.map((f) => f.id);
      const cuponIds = filas.map((f) => f.cupon_id).filter((id): id is string => !!id);

      const [{ data: metricasData }, { data: cuponesData }, { data: pedidosFallback }] = await Promise.all([
        idsCampanas.length > 0
          ? supabase
              .from("campanas_ads_metricas_diarias")
              .select("campana_ads_id, spend, resultados")
              .in("campana_ads_id", idsCampanas)
              .gte("fecha", desde)
          : Promise.resolve({ data: [] as { campana_ads_id: string; spend: number; resultados: number }[] }),
        cuponIds.length > 0
          ? supabase.from("cupones").select("id, codigo").in("id", cuponIds)
          : Promise.resolve({ data: [] as { id: string; codigo: string }[] }),
        codigosCupon.length > 0
          ? supabase
              .from("pedidos")
              .select("total")
              .in("codigo_descuento", codigosCupon)
              .eq("anulado", false)
              .gte("created_at", `${desde}T00:00:00`)
          : Promise.resolve({ data: [] as { total: number }[] }),
      ]);

      const metricasMap = new Map<string, { spend: number; resultados: number }>();
      for (const m of metricasData ?? []) {
        const actual = metricasMap.get(m.campana_ads_id) ?? { spend: 0, resultados: 0 };
        metricasMap.set(m.campana_ads_id, { spend: actual.spend + Number(m.spend), resultados: actual.resultados + m.resultados });
      }
      setMetricas(metricasMap);

      const codigoPorCuponId = new Map((cuponesData ?? []).map((c) => [c.id, c.codigo]));
      const fallback = {
        revenue: (pedidosFallback ?? []).reduce((acc, p) => acc + Number(p.total), 0),
        pedidos: (pedidosFallback ?? []).length,
      };

      // Ventas exactas por cupón vinculado, calculadas todas juntas para no
      // hacer un round-trip por fila.
      const codigosEspecificos = Array.from(new Set(Array.from(codigoPorCuponId.values())));
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
        if (fila.cupon_id) {
          const codigo = codigoPorCuponId.get(fila.cupon_id);
          const v = codigo ? ventasPorCodigo.get(codigo) : undefined;
          ventas.set(fila.id, { revenue: v?.revenue ?? 0, pedidos: v?.pedidos ?? 0, exclusiva: true });
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
      <div>
        <h3 className="text-sm font-semibold">Mis campañas</h3>
        <p className="text-xs text-muted-foreground">
          Últimos {DIAS_VENTANA} días. &quot;Resultados&quot; es lo que reporta la plataforma — &quot;Ventas
          reales&quot; sale de tus pedidos, nunca se suman entre sí.
        </p>
      </div>

      <TableCard badge={<Badge color="gris">{campanas.length}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaña</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead>Gasto</TableHead>
              <TableHead>Resultados (plataforma)</TableHead>
              <TableHead>Ventas reales</TableHead>
              <TableHead>ROAS real</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && campanas.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Todavía no tienes campañas asignadas.
                </TableCell>
              </TableRow>
            )}
            {campanas.map((c) => {
              const m = metricas.get(c.id) ?? { spend: 0, resultados: 0 };
              const v = ventasPorFila.get(c.id) ?? { revenue: 0, pedidos: 0, exclusiva: false };
              const roas = m.spend > 0 ? v.revenue / m.spend : null;
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground">{NIVEL_LABEL[c.nivel]}</p>
                  </TableCell>
                  <TableCell>{PLATAFORMA_LABEL[c.plataforma]}</TableCell>
                  <TableCell>S/.{m.spend.toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground">{m.resultados}</TableCell>
                  <TableCell>
                    <p>
                      S/.{v.revenue.toFixed(2)} ({v.pedidos})
                    </p>
                    {!v.exclusiva && (
                      <p className="text-xs text-muted-foreground">Total del periodo, no exclusivo de este video</p>
                    )}
                  </TableCell>
                  <TableCell>
                    {roas === null ? "—" : <Badge color={roas >= 1 ? "verde" : "naranja"}>{roas.toFixed(2)}x</Badge>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableCard>
    </div>
  );
}
