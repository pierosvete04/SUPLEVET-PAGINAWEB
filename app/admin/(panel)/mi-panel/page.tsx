"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Cupon } from "@/components/admin/cupones/CuponForm";
import { ClientesAsignados } from "@/components/admin/editores/ClientesAsignados";
import { EditorStatCards } from "@/components/admin/editores/EditorStatCards";
import { useEditorSesion } from "@/hooks/useEditorSesion";
import { agruparMetricasPorCampana, derivarMetricas, METRICAS_VACIAS, sumarMetricas, type FilaMetricaDiaria } from "@/lib/meta-ads-metrics";

const LABEL_TIPO: Record<Cupon["tipo"], string> = {
  envio_gratis: "Envío gratis",
  pct_envio: "% envío",
  pct_producto: "% producto",
  monto_fijo_producto: "Monto fijo producto",
};
const DIAS_VENTANA = 30;

interface Ventas {
  ventasTotal: number;
  pedidosCount: number;
  unidadesCount: number;
}

interface ResumenCampanas {
  campanasCount: number;
  spend: number;
  roasMeta: number | null;
}

export default function MiPanelEditorPage() {
  const { miId, cupones, codigos, cargando: cargandoSesion } = useEditorSesion();
  const [ventas, setVentas] = useState<Ventas>({ ventasTotal: 0, pedidosCount: 0, unidadesCount: 0 });
  const [resumenCampanas, setResumenCampanas] = useState<ResumenCampanas>({ campanasCount: 0, spend: 0, roasMeta: null });
  const [cargandoResumen, setCargandoResumen] = useState(true);

  useEffect(() => {
    if (cargandoSesion || !miId) return;
    async function cargar() {
      setCargandoResumen(true);
      const supabase = createClient();
      const desde = new Date(Date.now() - DIAS_VENTANA * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const [{ data: pedidos }, { data: campanasData }] = await Promise.all([
        codigos.length > 0
          ? supabase
              .from("pedidos")
              .select("total, productos")
              .in("codigo_descuento", codigos)
              .eq("anulado", false)
              .gte("created_at", `${desde}T00:00:00`)
          : Promise.resolve({ data: [] as { total: number; productos: { cantidad: number }[] }[] }),
        supabase.from("campanas_ads").select("id").eq("editor_id", miId),
      ]);

      const filas = pedidos ?? [];
      setVentas({
        ventasTotal: filas.reduce((acc, p) => acc + Number(p.total), 0),
        pedidosCount: filas.length,
        unidadesCount: filas.reduce(
          (acc, p) => acc + p.productos.reduce((a: number, i: { cantidad: number }) => a + i.cantidad, 0),
          0
        ),
      });

      const idsCampanas = (campanasData ?? []).map((c) => c.id);
      const { data: metricasData } =
        idsCampanas.length > 0
          ? await supabase
              .from("campanas_ads_metricas_diarias")
              .select("campana_ads_id, spend, impresiones, clics, video_views, resultados, valor_resultados")
              .in("campana_ads_id", idsCampanas)
              .gte("fecha", desde)
          : { data: [] as FilaMetricaDiaria[] };

      const porCampana = agruparMetricasPorCampana((metricasData as FilaMetricaDiaria[]) ?? []);
      const total = Array.from(porCampana.values()).reduce(sumarMetricas, METRICAS_VACIAS);
      setResumenCampanas({
        campanasCount: idsCampanas.length,
        spend: total.spend,
        roasMeta: derivarMetricas(total).roasMeta,
      });
      setCargandoResumen(false);
    }
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [miId, cargandoSesion, codigos.join(",")]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Mi dashboard</h2>
          <p className="text-sm text-muted-foreground">Resumen rápido de los últimos {DIAS_VENTANA} días.</p>
        </div>
        <Button asChild>
          <Link href="/admin/mi-panel/nuevo">
            <Plus className="h-4 w-4" /> Crear pedido
          </Link>
        </Button>
      </div>

      <EditorStatCards
        ventasTotal={ventas.ventasTotal}
        pedidosCount={ventas.pedidosCount}
        unidadesCount={ventas.unidadesCount}
      />

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <h3 className="text-sm font-semibold">Tus cupones</h3>
          {!cargandoSesion && cupones.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no tienes ningún cupón asignado — pídele uno al equipo de Suplevet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {cupones.map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
                  <span className="font-mono font-medium">{c.codigo}</span>
                  <span className="text-muted-foreground">
                    {LABEL_TIPO[c.tipo]}
                    {c.tipo !== "envio_gratis" && ` · ${c.tipo.startsWith("pct") ? `${c.valor}%` : `S/.${c.valor}`}`}
                  </span>
                  <Badge color={c.activo ? "verde" : "gris"}>{c.activo ? "Activo" : "Inactivo"}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div>
            <h3 className="text-sm font-semibold">Tus campañas</h3>
            {cargandoResumen ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : resumenCampanas.campanasCount === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no tienes campañas asignadas.</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {resumenCampanas.campanasCount} campaña{resumenCampanas.campanasCount === 1 ? "" : "s"} · Gasto S/.
                {resumenCampanas.spend.toFixed(2)} · ROAS plataforma{" "}
                {resumenCampanas.roasMeta === null ? "—" : `${resumenCampanas.roasMeta.toFixed(2)}x`}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/mi-panel/analiticas">
              Ver analíticas completas <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {miId && <ClientesAsignados editorId={miId} codigosCupon={codigos} puedeAsignar={false} />}
    </div>
  );
}
