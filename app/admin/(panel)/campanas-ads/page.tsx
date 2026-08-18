"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, RefreshCw, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { TableCard } from "@/components/admin/table/TableCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CuentaAds {
  external_id: string;
  plataforma: "meta" | "tiktok";
  nombre: string;
  sincronizar: boolean;
}

interface CampanaAds {
  id: string;
  plataforma: "meta" | "tiktok";
  nivel: "campana" | "conjunto";
  external_id: string;
  campana_external_id: string | null;
  cuenta_external_id: string | null;
  nombre: string;
  estado: string | null;
  editor_id: string | null;
  sincronizado_at: string;
}

interface EditorOpcion {
  id: string;
  nombre: string;
}

interface CuponOpcion {
  id: string;
  codigo: string;
  editor_id: string | null;
}

// Solo se suman los valores ADITIVOS (gasto, impresiones, clics, video
// views, resultados, valor de resultados) — CTR/CPC/CPM se recalculan a
// partir de esa suma, nunca sumando directamente los % o promedios diarios
// que devuelve Meta (sumar tasas de días distintos da un número sin sentido).
interface MetricasAgregadas {
  spend: number;
  impresiones: number;
  clics: number;
  videoViews: number;
  resultados: number;
  valorResultados: number;
}

const METRICAS_VACIAS: MetricasAgregadas = {
  spend: 0,
  impresiones: 0,
  clics: 0,
  videoViews: 0,
  resultados: 0,
  valorResultados: 0,
};

const SIN_ASIGNAR = "__sin_asignar__";
const TODOS = "__todos__";
const NIVEL_LABEL: Record<CampanaAds["nivel"], string> = { campana: "Campaña", conjunto: "Conjunto de anuncios" };
const PLATAFORMA_LABEL: Record<CampanaAds["plataforma"], string> = { meta: "Meta", tiktok: "TikTok" };
const ESTADOS_ACTIVOS = ["ACTIVE", "CAMPAIGN_ACTIVE"];

function sumarMetricas(a: MetricasAgregadas, b: MetricasAgregadas): MetricasAgregadas {
  return {
    spend: a.spend + b.spend,
    impresiones: a.impresiones + b.impresiones,
    clics: a.clics + b.clics,
    videoViews: a.videoViews + b.videoViews,
    resultados: a.resultados + b.resultados,
    valorResultados: a.valorResultados + b.valorResultados,
  };
}

// Derivados a partir de las sumas aditivas — ver comentario de MetricasAgregadas.
function derivarMetricas(m: MetricasAgregadas) {
  return {
    ctr: m.impresiones > 0 ? (m.clics / m.impresiones) * 100 : null,
    cpc: m.clics > 0 ? m.spend / m.clics : null,
    cpm: m.impresiones > 0 ? (m.spend / m.impresiones) * 1000 : null,
    costoPorResultado: m.resultados > 0 ? m.spend / m.resultados : null,
    roasMeta: m.spend > 0 ? m.valorResultados / m.spend : null,
  };
}

export default function AdminCampanasAdsPage() {
  const [cuentas, setCuentas] = useState<CuentaAds[]>([]);
  const [buscandoCuentas, setBuscandoCuentas] = useState(false);
  const [campanas, setCampanas] = useState<CampanaAds[]>([]);
  const [metricas, setMetricas] = useState<Map<string, MetricasAgregadas>>(new Map());
  const [editores, setEditores] = useState<EditorOpcion[]>([]);
  const [cupones, setCupones] = useState<CuponOpcion[]>([]);
  // campana_ads_id -> Set<cupon_id> — un editor puede correr varios cupones
  // distintos dentro de la misma campaña, no es una relación 1 a 1.
  const [cuponesPorCampana, setCuponesPorCampana] = useState<Map<string, Set<string>>>(new Map());
  const [cargando, setCargando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);

  // Vista por defecto: solo campañas activas — las pausadas/archivadas rara
  // vez son lo que se quiere analizar de entrada, quedan a un filtro.
  const [filtroNivel, setFiltroNivel] = useState<"campana" | "conjunto" | "todos">("campana");
  const [filtroEstado, setFiltroEstado] = useState<"activas" | "todas">("activas");
  const [filtroEditor, setFiltroEditor] = useState<string>(TODOS);

  const cargar = useCallback(async () => {
    setCargando(true);
    const supabase = createClient();
    const [
      { data: cuentasData },
      { data: campanasData },
      { data: editoresData },
      { data: cuponesData },
      { data: metricasData },
      { data: vinculosData },
    ] = await Promise.all([
      supabase.from("campanas_ads_cuentas").select("*").order("nombre"),
      supabase.from("campanas_ads").select("*").order("nombre"),
      supabase.from("editores_resumen").select("id, nombre").eq("activo", true).order("nombre"),
      supabase.from("cupones").select("id, codigo, editor_id"),
      supabase
        .from("campanas_ads_metricas_diarias")
        .select("campana_ads_id, spend, impresiones, clics, video_views, resultados, valor_resultados")
        .gte("fecha", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)),
      supabase.from("campanas_ads_cupones").select("campana_ads_id, cupon_id"),
    ]);

    setCuentas((cuentasData as CuentaAds[]) ?? []);
    setCampanas((campanasData as CampanaAds[]) ?? []);
    setEditores((editoresData as EditorOpcion[]) ?? []);
    setCupones((cuponesData as CuponOpcion[]) ?? []);

    const vinculos = new Map<string, Set<string>>();
    for (const v of (vinculosData as { campana_ads_id: string; cupon_id: string }[]) ?? []) {
      const actual = vinculos.get(v.campana_ads_id) ?? new Set<string>();
      actual.add(v.cupon_id);
      vinculos.set(v.campana_ads_id, actual);
    }
    setCuponesPorCampana(vinculos);

    const agregadas = new Map<string, MetricasAgregadas>();
    interface FilaMetrica {
      campana_ads_id: string;
      spend: number;
      impresiones: number;
      clics: number;
      video_views: number;
      resultados: number;
      valor_resultados: number;
    }
    for (const m of (metricasData as FilaMetrica[]) ?? []) {
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
    setMetricas(agregadas);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Llamada en vivo a Meta (/me/adaccounts) — no se hace sola al abrir la
  // página para no gastar rate limit cada vez, solo cuando el admin pide
  // buscar cuentas nuevas (ej. después de crear una en Meta).
  async function buscarCuentasNuevas() {
    setBuscandoCuentas(true);
    const res = await fetch("/api/admin/campanas-ads/cuentas");
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error ?? "No se pudo buscar cuentas en Meta.");
      setBuscandoCuentas(false);
      return;
    }
    toast.success(`${data.cuentas.length} cuenta${data.cuentas.length === 1 ? "" : "s"} publicitaria(s) encontrada(s).`);
    await cargar();
    setBuscandoCuentas(false);
  }

  async function toggleCuenta(externalId: string, sincronizar: boolean) {
    setCuentas((prev) => prev.map((c) => (c.external_id === externalId ? { ...c, sincronizar } : c)));
    await createClient().from("campanas_ads_cuentas").update({ sincronizar }).eq("external_id", externalId);
  }

  async function sincronizar() {
    setSincronizando(true);
    const res = await fetch("/api/admin/campanas-ads/sincronizar", { method: "POST" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error ?? "No se pudo sincronizar con Meta Ads.");
      setSincronizando(false);
      return;
    }
    toast.success(`Sincronizado: ${data.campanias} campañas, ${data.conjuntos} conjuntos.`);
    await cargar();
    setSincronizando(false);
  }

  async function asignarEditor(campanaId: string, editorId: string | null) {
    setCampanas((prev) => prev.map((c) => (c.id === campanaId ? { ...c, editor_id: editorId } : c)));
    // Cambiar de editor invalida los cupones vinculados de antes — eran de
    // otra persona, ya no aplican.
    setCuponesPorCampana((prev) => {
      const copia = new Map(prev);
      copia.delete(campanaId);
      return copia;
    });
    const supabase = createClient();
    await Promise.all([
      supabase.from("campanas_ads").update({ editor_id: editorId }).eq("id", campanaId),
      supabase.from("campanas_ads_cupones").delete().eq("campana_ads_id", campanaId),
    ]);
  }

  async function toggleCupon(campanaId: string, cuponId: string, incluir: boolean) {
    setCuponesPorCampana((prev) => {
      const copia = new Map(prev);
      const actual = new Set(copia.get(campanaId) ?? []);
      if (incluir) actual.add(cuponId);
      else actual.delete(cuponId);
      copia.set(campanaId, actual);
      return copia;
    });
    const supabase = createClient();
    if (incluir) {
      await supabase.from("campanas_ads_cupones").insert({ campana_ads_id: campanaId, cupon_id: cuponId });
    } else {
      await supabase.from("campanas_ads_cupones").delete().eq("campana_ads_id", campanaId).eq("cupon_id", cuponId);
    }
  }

  const cuentasPorId = useMemo(() => new Map(cuentas.map((c) => [c.external_id, c])), [cuentas]);

  const campanasFiltradas = useMemo(() => {
    return campanas.filter((c) => {
      // El checkbox de "sincronizar" también oculta/muestra sus campañas ya
      // guardadas, no solo controla la próxima sincronización — es lo que se
      // espera de un filtro de cuentas.
      const cuenta = c.cuenta_external_id ? cuentasPorId.get(c.cuenta_external_id) : undefined;
      if (cuenta && !cuenta.sincronizar) return false;
      if (filtroNivel !== "todos" && c.nivel !== filtroNivel) return false;
      if (filtroEstado === "activas" && !ESTADOS_ACTIVOS.includes(c.estado ?? "")) return false;
      if (filtroEditor === TODOS) return true;
      if (filtroEditor === SIN_ASIGNAR) return !c.editor_id;
      return c.editor_id === filtroEditor;
    });
  }, [campanas, cuentasPorId, filtroNivel, filtroEstado, filtroEditor]);

  // Resumen del filtro actual — al elegir un editor puntual, esto ES su
  // resumen "editor vs. métricas" que pediste, sin necesitar una vista aparte.
  const resumenFiltrado = useMemo(
    () => campanasFiltradas.reduce((acc, c) => sumarMetricas(acc, metricas.get(c.id) ?? METRICAS_VACIAS), METRICAS_VACIAS),
    [campanasFiltradas, metricas]
  );
  const derivadoResumen = derivarMetricas(resumenFiltrado);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Campañas de Ads</h2>
          <p className="text-sm text-muted-foreground">
            Solo lectura — los cambios reales se hacen en Meta Ads Manager. Acá solo asignas a qué editor le
            pertenece cada campaña o conjunto de anuncios.
          </p>
        </div>
        <Button onClick={sincronizar} disabled={sincronizando} variant="outline">
          <RefreshCw className={`h-4 w-4 ${sincronizando ? "animate-spin" : ""}`} />
          {sincronizando ? "Sincronizando…" : "Sincronizar ahora"}
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Cuentas publicitarias</h3>
              <p className="text-xs text-muted-foreground">
                Desmarcar una cuenta oculta sus campañas de la tabla de abajo Y la excluye de la próxima
                sincronización. Si creas una cuenta nueva en Meta, búscala acá para que aparezca.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={buscarCuentasNuevas} disabled={buscandoCuentas}>
              <Search className="h-4 w-4" />
              {buscandoCuentas ? "Buscando…" : "Buscar cuentas nuevas"}
            </Button>
          </div>
          {cuentas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin cuentas encontradas todavía — usa &quot;Buscar cuentas nuevas&quot;.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {cuentas.map((c) => (
                <label key={c.external_id} className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
                  <Checkbox
                    checked={c.sincronizar}
                    onCheckedChange={(checked) => toggleCuenta(c.external_id, checked === true)}
                  />
                  {c.nombre}
                  <Badge color="gris">{PLATAFORMA_LABEL[c.plataforma]}</Badge>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Nivel</label>
          <Select value={filtroNivel} onValueChange={(v) => setFiltroNivel(v as typeof filtroNivel)}>
            <SelectTrigger className="w-52 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="campana">Solo campañas</SelectItem>
              <SelectItem value="conjunto">Solo conjuntos de anuncios</SelectItem>
              <SelectItem value="todos">Campañas y conjuntos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Estado</label>
          <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v as typeof filtroEstado)}>
            <SelectTrigger className="w-44 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activas">Solo activas</SelectItem>
              <SelectItem value="todas">Todas (incl. pausadas)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Editor</label>
          <Select value={filtroEditor} onValueChange={setFiltroEditor}>
            <SelectTrigger className="w-52 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos los editores</SelectItem>
              <SelectItem value={SIN_ASIGNAR}>Sin asignar</SelectItem>
              {editores.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resumen del filtro actual: al elegir un editor, esto ES su resumen. */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Gasto", valor: `S/.${resumenFiltrado.spend.toFixed(2)}` },
          { label: "Impresiones", valor: resumenFiltrado.impresiones.toLocaleString("es-PE") },
          { label: "CTR", valor: derivadoResumen.ctr === null ? "—" : `${derivadoResumen.ctr.toFixed(2)}%` },
          { label: "Resultados (Meta)", valor: resumenFiltrado.resultados.toLocaleString("es-PE") },
          { label: "Valor resultados (Meta)", valor: `S/.${resumenFiltrado.valorResultados.toFixed(2)}` },
          { label: "ROAS (Meta)", valor: derivadoResumen.roasMeta === null ? "—" : `${derivadoResumen.roasMeta.toFixed(2)}x` },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">{item.label}</CardDescription>
            </CardHeader>
            <CardTitle className="px-6 pb-4 text-lg font-semibold tabular-nums">{item.valor}</CardTitle>
          </Card>
        ))}
      </div>

      <TableCard badge={<Badge color="gris">{campanasFiltradas.length}</Badge>}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Gasto</TableHead>
                <TableHead>Impresiones</TableHead>
                <TableHead>Clics</TableHead>
                <TableHead>CTR</TableHead>
                <TableHead>CPC</TableHead>
                <TableHead>CPM</TableHead>
                <TableHead>Video views</TableHead>
                <TableHead>Resultados</TableHead>
                <TableHead>Costo/Resultado</TableHead>
                <TableHead>Valor resultados</TableHead>
                <TableHead>ROAS (Meta)</TableHead>
                <TableHead>Editor</TableHead>
                <TableHead>Cupón vinculado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!cargando && campanasFiltradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={17} className="text-center text-muted-foreground">
                    {campanas.length === 0
                      ? 'Sin campañas sincronizadas todavía — usa "Sincronizar ahora".'
                      : "Ninguna campaña coincide con estos filtros."}
                  </TableCell>
                </TableRow>
              )}
              {campanasFiltradas.map((c) => {
                const m = metricas.get(c.id) ?? METRICAS_VACIAS;
                const d = derivarMetricas(m);
                const cuponesDelEditor = cupones.filter((cu) => cu.editor_id === c.editor_id);
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="font-medium">{c.nombre}</p>
                      {c.nivel === "conjunto" && c.campana_external_id && (
                        <p className="text-xs text-muted-foreground">Dentro de campaña {c.campana_external_id}</p>
                      )}
                    </TableCell>
                    <TableCell>{PLATAFORMA_LABEL[c.plataforma]}</TableCell>
                    <TableCell>{NIVEL_LABEL[c.nivel]}</TableCell>
                    <TableCell>
                      <Badge color={ESTADOS_ACTIVOS.includes(c.estado ?? "") ? "verde" : "gris"}>{c.estado ?? "—"}</Badge>
                    </TableCell>
                    <TableCell>S/.{m.spend.toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">{m.impresiones.toLocaleString("es-PE")}</TableCell>
                    <TableCell className="text-muted-foreground">{m.clics.toLocaleString("es-PE")}</TableCell>
                    <TableCell className="text-muted-foreground">{d.ctr === null ? "—" : `${d.ctr.toFixed(2)}%`}</TableCell>
                    <TableCell className="text-muted-foreground">{d.cpc === null ? "—" : `S/.${d.cpc.toFixed(2)}`}</TableCell>
                    <TableCell className="text-muted-foreground">{d.cpm === null ? "—" : `S/.${d.cpm.toFixed(2)}`}</TableCell>
                    <TableCell className="text-muted-foreground">{m.videoViews.toLocaleString("es-PE")}</TableCell>
                    <TableCell>{m.resultados}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.costoPorResultado === null ? "—" : `S/.${d.costoPorResultado.toFixed(2)}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground">S/.{m.valorResultados.toFixed(2)}</TableCell>
                    <TableCell>
                      {d.roasMeta === null ? (
                        "—"
                      ) : (
                        <Badge color={d.roasMeta >= 1 ? "verde" : "naranja"}>{d.roasMeta.toFixed(2)}x</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={c.editor_id ?? SIN_ASIGNAR}
                        onValueChange={(v) => asignarEditor(c.id, v === SIN_ASIGNAR ? null : v)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={SIN_ASIGNAR}>Sin asignar</SelectItem>
                          {editores.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const seleccionados = cuponesPorCampana.get(c.id) ?? new Set<string>();
                        return (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" disabled={!c.editor_id} className="w-40 justify-between">
                                <span className="truncate">
                                  {seleccionados.size === 0
                                    ? "Sin vincular"
                                    : cuponesDelEditor
                                        .filter((cu) => seleccionados.has(cu.id))
                                        .map((cu) => cu.codigo)
                                        .join(", ")}
                                </span>
                                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {cuponesDelEditor.length === 0 ? (
                                <p className="px-2 py-1.5 text-sm text-muted-foreground">Este editor no tiene cupones.</p>
                              ) : (
                                cuponesDelEditor.map((cu) => (
                                  <DropdownMenuCheckboxItem
                                    key={cu.id}
                                    checked={seleccionados.has(cu.id)}
                                    onCheckedChange={(checked) => toggleCupon(c.id, cu.id, checked === true)}
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    {cu.codigo}
                                  </DropdownMenuCheckboxItem>
                                ))
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        );
                      })()}
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
