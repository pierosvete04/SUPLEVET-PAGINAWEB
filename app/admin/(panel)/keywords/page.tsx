"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ExternalLink, Minus, RefreshCw, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { TableCard } from "@/components/admin/table/TableCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IdeasKeywords } from "@/components/admin/keywords/IdeasKeywords";

/**
 * Rango de posiciones donde un cambio de título/meta rinde más: Google ya te
 * considera relevante para esa consulta, pero todavía no estás en los
 * primeros lugares. Por debajo de 5 ya ganaste; más allá de 20 hace falta
 * bastante más que reescribir la meta.
 */
const OPORTUNIDAD_DESDE = 5;
const OPORTUNIDAD_HASTA = 20;

/**
 * La otra mitad del cuadro: consultas con demanda real donde estamos MUY
 * abajo. Ahí reescribir la meta no alcanza — hace falta contenido que
 * responda la pregunta. Con el volumen actual del sitio (unas 370
 * impresiones al mes) casi todo lo que cae en la banda 5–20 tiene una sola
 * impresión, mientras que los temas con 10+ impresiones están en posición
 * 30–40. Por eso esta vista existe: sin ella, la pantalla muestra ruido y
 * esconde lo único accionable.
 */
const DEMANDA_MINIMA = 10;
const POSICION_LEJANA = 20;

const SIN_PRODUCTO = "__sin_producto__";
const TODOS = "__todos__";

type Estado = "sin_aplicar" | "aplicada" | "descartada";

const ESTADO_LABEL: Record<Estado, string> = {
  sin_aplicar: "Sin aplicar",
  aplicada: "Aplicada",
  descartada: "Descartada",
};

interface Keyword {
  id: string;
  consulta: string;
  impresiones: number;
  clics: number;
  ctr: number;
  posicion: number | null;
  posicion_anterior: number | null;
  pagina: string | null;
  volumen_mensual: number | null;
  estado: Estado;
  producto_id: string | null;
  periodo_desde: string | null;
  periodo_hasta: string | null;
}

interface ProductoOpcion {
  id: string;
  nombre: string;
}

function formatearPorcentaje(fraccion: number): string {
  return `${(fraccion * 100).toFixed(1)} %`;
}

function formatearPosicion(posicion: number | null): string {
  return posicion === null ? "—" : posicion.toFixed(1);
}

/**
 * En Search Console una posición MENOR es mejor (1 es el primer resultado),
 * así que la flecha hacia arriba corresponde a que el número bajó.
 */
function DeltaPosicion({ actual, anterior }: { actual: number | null; anterior: number | null }) {
  if (actual === null || anterior === null) return null;

  const diferencia = anterior - actual;
  // Movimientos de menos de un décimo son ruido del promedio, no una mejora.
  if (Math.abs(diferencia) < 0.1) {
    return <Minus className="inline h-3 w-3 text-muted-foreground" aria-label="sin cambio" />;
  }

  const mejoro = diferencia > 0;
  const Icono = mejoro ? ArrowUp : ArrowDown;
  return (
    <span className={mejoro ? "text-green-600" : "text-red-600"}>
      <Icono className="inline h-3 w-3" aria-hidden />
      <span className="ml-0.5 text-xs">{Math.abs(diferencia).toFixed(1)}</span>
    </span>
  );
}

export default function AdminKeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [productos, setProductos] = useState<ProductoOpcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);

  // Entrada por defecto: las oportunidades sin trabajar, que es la pregunta
  // que trae al admin a esta pantalla. El resto queda a un filtro.
  const [vista, setVista] = useState<"oportunidades" | "contenido" | "todas">("oportunidades");
  const [filtroEstado, setFiltroEstado] = useState<Estado | typeof TODOS>("sin_aplicar");
  const [busqueda, setBusqueda] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    const supabase = createClient();
    const [{ data: keywordsData }, { data: productosData }] = await Promise.all([
      supabase.from("seo_keywords").select("*").order("impresiones", { ascending: false }),
      supabase.from("productos_web").select("id, nombre").eq("activo", true).order("nombre"),
    ]);

    setKeywords((keywordsData as Keyword[]) ?? []);
    setProductos((productosData as ProductoOpcion[]) ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function sincronizar() {
    setSincronizando(true);
    const res = await fetch("/api/admin/keywords/sincronizar", { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data?.error ?? "No se pudo sincronizar con Search Console.");
    } else if (data.aviso) {
      toast.info(data.aviso);
    } else {
      toast.success(`${data.sincronizadas} consultas actualizadas.`);
      await cargar();
    }
    setSincronizando(false);
  }

  // Actualización optimista: la tabla se siente instantánea y, si Supabase
  // falla, se revierte recargando en vez de dejar la fila mintiendo.
  async function actualizar(id: string, cambios: Partial<Pick<Keyword, "estado" | "producto_id">>) {
    setKeywords((prev) => prev.map((k) => (k.id === id ? { ...k, ...cambios } : k)));
    const { error } = await createClient().from("seo_keywords").update(cambios).eq("id", id);
    if (error) {
      toast.error("No se pudo guardar el cambio.");
      await cargar();
    }
  }

  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return keywords.filter((k) => {
      if (vista === "oportunidades") {
        if (k.posicion === null) return false;
        if (k.posicion < OPORTUNIDAD_DESDE || k.posicion > OPORTUNIDAD_HASTA) return false;
      }
      if (vista === "contenido") {
        if (k.posicion === null) return false;
        if (k.posicion <= POSICION_LEJANA || k.impresiones < DEMANDA_MINIMA) return false;
      }
      if (filtroEstado !== TODOS && k.estado !== filtroEstado) return false;
      if (termino && !k.consulta.includes(termino)) return false;
      return true;
    });
  }, [keywords, vista, filtroEstado, busqueda]);

  const resumen = useMemo(() => {
    const oportunidades = keywords.filter(
      (k) =>
        k.posicion !== null &&
        k.posicion >= OPORTUNIDAD_DESDE &&
        k.posicion <= OPORTUNIDAD_HASTA &&
        k.estado === "sin_aplicar"
    ).length;
    const temasContenido = keywords.filter(
      (k) =>
        k.posicion !== null &&
        k.posicion > POSICION_LEJANA &&
        k.impresiones >= DEMANDA_MINIMA &&
        k.estado === "sin_aplicar"
    ).length;
    return {
      total: keywords.length,
      oportunidades,
      temasContenido,
      aplicadas: keywords.filter((k) => k.estado === "aplicada").length,
      clics: keywords.reduce((suma, k) => suma + k.clics, 0),
    };
  }, [keywords]);

  // Se pasa al buscador de ideas para que marque las que ya están guardadas
  // en vez de ofrecer agregarlas de nuevo.
  const yaGuardadas = useMemo(() => new Set(keywords.map((k) => k.consulta)), [keywords]);

  const periodo =
    keywords[0]?.periodo_desde && keywords[0]?.periodo_hasta
      ? `${keywords[0].periodo_desde} al ${keywords[0].periodo_hasta}`
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Keywords</h2>
          <p className="text-sm text-muted-foreground">
            Las consultas reales por las que Google te muestra.{" "}
            {periodo ? `Datos del ${periodo}.` : "Sincroniza para traer los datos."}
          </p>
        </div>
        <Button onClick={sincronizar} disabled={sincronizando} variant="outline">
          <RefreshCw className={`h-4 w-4 ${sincronizando ? "animate-spin" : ""}`} />
          {sincronizando ? "Sincronizando…" : "Sincronizar ahora"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Tarjeta titulo="Consultas" valor={resumen.total} />
        <Tarjeta
          titulo="Oportunidades"
          valor={resumen.oportunidades}
          detalle={`Posición ${OPORTUNIDAD_DESDE}–${OPORTUNIDAD_HASTA}: reescribir título y meta`}
          destacar
        />
        <Tarjeta
          titulo="Temas de contenido"
          valor={resumen.temasContenido}
          detalle={`${DEMANDA_MINIMA}+ impresiones en posición ${POSICION_LEJANA}+: hace falta escribir`}
          destacar
        />
        <Tarjeta titulo="Aplicadas" valor={resumen.aplicadas} />
        <Tarjeta titulo="Clics del período" valor={resumen.clics} />
      </div>

      <IdeasKeywords yaGuardadas={yaGuardadas} onGuardada={cargar} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Vista</label>
          <Select value={vista} onValueChange={(v) => setVista(v as typeof vista)}>
            <SelectTrigger className="w-64 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oportunidades">
                Oportunidades (posición {OPORTUNIDAD_DESDE}–{OPORTUNIDAD_HASTA})
              </SelectItem>
              <SelectItem value="contenido">
                Temas de contenido ({DEMANDA_MINIMA}+ impr., posición {POSICION_LEJANA}+)
              </SelectItem>
              <SelectItem value="todas">Todas las consultas</SelectItem>
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
              <SelectItem value={TODOS}>Todos</SelectItem>
              <SelectItem value="sin_aplicar">Sin aplicar</SelectItem>
              <SelectItem value="aplicada">Aplicadas</SelectItem>
              <SelectItem value="descartada">Descartadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Buscar</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Filtrar consultas…"
              className="w-64 bg-white pl-8"
            />
          </div>
        </div>
      </div>

      <TableCard title="Consultas" badge={<Badge color="gris">{filtradas.length}</Badge>}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consulta</TableHead>
                <TableHead className="text-right">Impresiones</TableHead>
                <TableHead className="text-right">Clics</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Posición</TableHead>
                <TableHead className="text-right">Búsq./mes</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargando && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    Cargando…
                  </TableCell>
                </TableRow>
              )}

              {!cargando && filtradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    {keywords.length === 0
                      ? "Todavía no hay datos. Usa Sincronizar ahora para traerlos de Search Console."
                      : "Ninguna consulta coincide con los filtros."}
                  </TableCell>
                </TableRow>
              )}

              {!cargando &&
                filtradas.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="max-w-xs">
                      <span className="font-medium">{k.consulta}</span>
                      {k.pagina && (
                        <a
                          href={k.pagina}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1.5 inline-flex text-muted-foreground hover:text-foreground"
                          title={k.pagina}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{k.impresiones}</TableCell>
                    <TableCell className="text-right tabular-nums">{k.clics}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatearPorcentaje(k.ctr)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatearPosicion(k.posicion)}{" "}
                      <DeltaPosicion actual={k.posicion} anterior={k.posicion_anterior} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {k.volumen_mensual === null ? "—" : k.volumen_mensual.toLocaleString("es-PE")}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={k.producto_id ?? SIN_PRODUCTO}
                        onValueChange={(v) => actualizar(k.id, { producto_id: v === SIN_PRODUCTO ? null : v })}
                      >
                        <SelectTrigger className="w-48 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={SIN_PRODUCTO}>Sin asignar</SelectItem>
                          {productos.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={k.estado} onValueChange={(v) => actualizar(k.id, { estado: v as Estado })}>
                        <SelectTrigger className="w-36 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(ESTADO_LABEL) as Estado[]).map((estado) => (
                            <SelectItem key={estado} value={estado}>
                              {ESTADO_LABEL[estado]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </TableCard>
    </div>
  );
}

function Tarjeta({
  titulo,
  valor,
  detalle,
  destacar,
}: {
  titulo: string;
  valor: number;
  detalle?: string;
  destacar?: boolean;
}) {
  return (
    <Card className={destacar ? "border-primary/40" : undefined}>
      <CardContent className="pt-6">
        <p className="text-xs font-medium text-muted-foreground">{titulo}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{valor}</p>
        {detalle && <p className="mt-1 text-xs text-muted-foreground">{detalle}</p>}
      </CardContent>
    </Card>
  );
}
