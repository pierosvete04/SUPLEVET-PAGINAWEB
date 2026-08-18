"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { TableCard } from "@/components/admin/table/TableCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  nombre: string;
  estado: string | null;
  editor_id: string | null;
  cupon_id: string | null;
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

interface MetricasAgregadas {
  spend: number;
  resultados: number;
}

const SIN_ASIGNAR = "__sin_asignar__";
const NIVEL_LABEL: Record<CampanaAds["nivel"], string> = { campana: "Campaña", conjunto: "Conjunto de anuncios" };
const PLATAFORMA_LABEL: Record<CampanaAds["plataforma"], string> = { meta: "Meta", tiktok: "TikTok" };

export default function AdminCampanasAdsPage() {
  const [cuentas, setCuentas] = useState<CuentaAds[]>([]);
  const [buscandoCuentas, setBuscandoCuentas] = useState(false);
  const [campanas, setCampanas] = useState<CampanaAds[]>([]);
  const [metricas, setMetricas] = useState<Map<string, MetricasAgregadas>>(new Map());
  const [editores, setEditores] = useState<EditorOpcion[]>([]);
  const [cupones, setCupones] = useState<CuponOpcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const supabase = createClient();
    const [{ data: cuentasData }, { data: campanasData }, { data: editoresData }, { data: cuponesData }, { data: metricasData }] =
      await Promise.all([
        supabase.from("campanas_ads_cuentas").select("*").order("nombre"),
        supabase.from("campanas_ads").select("*").order("nombre"),
        supabase.from("editores_resumen").select("id, nombre").eq("activo", true).order("nombre"),
        supabase.from("cupones").select("id, codigo, editor_id"),
        supabase
          .from("campanas_ads_metricas_diarias")
          .select("campana_ads_id, spend, resultados")
          .gte("fecha", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)),
      ]);

    setCuentas((cuentasData as CuentaAds[]) ?? []);
    setCampanas((campanasData as CampanaAds[]) ?? []);
    setEditores((editoresData as EditorOpcion[]) ?? []);
    setCupones((cuponesData as CuponOpcion[]) ?? []);

    const agregadas = new Map<string, MetricasAgregadas>();
    for (const m of (metricasData as { campana_ads_id: string; spend: number; resultados: number }[]) ?? []) {
      const actual = agregadas.get(m.campana_ads_id) ?? { spend: 0, resultados: 0 };
      agregadas.set(m.campana_ads_id, { spend: actual.spend + Number(m.spend), resultados: actual.resultados + m.resultados });
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
    setCampanas((prev) => prev.map((c) => (c.id === campanaId ? { ...c, editor_id: editorId, cupon_id: null } : c)));
    await createClient().from("campanas_ads").update({ editor_id: editorId, cupon_id: null }).eq("id", campanaId);
  }

  async function asignarCupon(campanaId: string, cuponId: string | null) {
    setCampanas((prev) => prev.map((c) => (c.id === campanaId ? { ...c, cupon_id: cuponId } : c)));
    await createClient().from("campanas_ads").update({ cupon_id: cuponId }).eq("id", campanaId);
  }

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
                Marca cuáles sincronizar — &quot;Sincronizar ahora&quot; solo trae campañas de las marcadas. Si
                creas una cuenta nueva en Meta, búscala acá para que aparezca.
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
                <label
                  key={c.external_id}
                  className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
                >
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

      <TableCard badge={<Badge color="gris">{campanas.length}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Gasto (30 días)</TableHead>
              <TableHead>Resultados (Meta)</TableHead>
              <TableHead>Editor</TableHead>
              <TableHead>Cupón vinculado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && campanas.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Sin campañas sincronizadas todavía — usa &quot;Sincronizar ahora&quot;.
                </TableCell>
              </TableRow>
            )}
            {campanas.map((c) => {
              const m = metricas.get(c.id);
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
                    <Badge color={c.estado === "ACTIVE" ? "verde" : "gris"}>{c.estado ?? "—"}</Badge>
                  </TableCell>
                  <TableCell>S/.{(m?.spend ?? 0).toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground">{m?.resultados ?? 0}</TableCell>
                  <TableCell>
                    <Select
                      value={c.editor_id ?? SIN_ASIGNAR}
                      onValueChange={(v) => asignarEditor(c.id, v === SIN_ASIGNAR ? null : v)}
                    >
                      <SelectTrigger className="w-44">
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
                    <Select
                      value={c.cupon_id ?? SIN_ASIGNAR}
                      onValueChange={(v) => asignarCupon(c.id, v === SIN_ASIGNAR ? null : v)}
                      disabled={!c.editor_id}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Sin vincular" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SIN_ASIGNAR}>Sin vincular</SelectItem>
                        {cuponesDelEditor.map((cu) => (
                          <SelectItem key={cu.id} value={cu.id}>
                            {cu.codigo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
