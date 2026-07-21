"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { TableCard } from "@/components/admin/table/TableCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VentajaForm } from "@/components/admin/oportunidad/VentajaForm";
import type { OportunidadVentaja } from "@/lib/oportunidad-ventajas";

interface TextosOportunidad {
  oportunidad_hero_titulo: string | null;
  oportunidad_hero_texto: string | null;
  oportunidad_hero_imagen: string | null;
  oportunidad_intro_titulo: string | null;
  oportunidad_intro_texto_1: string | null;
  oportunidad_intro_texto_2: string | null;
  oportunidad_intro_imagen: string | null;
  oportunidad_ventajas_titulo: string | null;
  oportunidad_ventajas_texto: string | null;
  oportunidad_producto_titulo: string | null;
  oportunidad_producto_texto: string | null;
  oportunidad_producto_bullets: string | null;
  oportunidad_producto_imagen: string | null;
  oportunidad_pasos_titulo: string | null;
  oportunidad_paso1_titulo: string | null;
  oportunidad_paso1_texto: string | null;
  oportunidad_paso2_titulo: string | null;
  oportunidad_paso2_texto: string | null;
  oportunidad_paso3_titulo: string | null;
  oportunidad_paso3_texto: string | null;
  oportunidad_postular_titulo: string | null;
  oportunidad_postular_texto_1: string | null;
  oportunidad_postular_texto_2: string | null;
}

interface DistribuidorLead {
  id: string;
  created_at: string;
  nombre: string;
  telefono: string;
  email: string | null;
  ciudad: string | null;
  experiencia: string | null;
  mensaje: string | null;
  estado: string;
}

const ESTADOS_LEAD = ["nuevo", "contactado", "descartado"] as const;

function Campo({
  id,
  label,
  value,
  onChange,
  textarea = false,
  rows = 3,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {textarea ? (
        <Textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function CampoImagen({
  id,
  label,
  value,
  subiendo,
  onUpload,
}: {
  id: string;
  label: string;
  value: string;
  subiendo: boolean;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="file"
        accept="image/*"
        disabled={subiendo}
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
      />
      {value && (
        <div className="relative h-32 w-full max-w-sm overflow-hidden rounded-md border">
          <Image src={value} alt="" fill className="object-cover" sizes="384px" />
        </div>
      )}
    </div>
  );
}

export default function AdminOportunidadPage() {
  const [textos, setTextos] = useState<TextosOportunidad | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const [ventajas, setVentajas] = useState<OportunidadVentaja[]>([]);
  const [editando, setEditando] = useState<OportunidadVentaja | null>(null);
  const [creando, setCreando] = useState(false);

  const [leads, setLeads] = useState<DistribuidorLead[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const supabase = createClient();
    const [{ data: config }, { data: ventajasData }, { data: leadsData }] = await Promise.all([
      supabase
        .from("configuracion_sitio")
        .select(
          "oportunidad_hero_titulo, oportunidad_hero_texto, oportunidad_hero_imagen, oportunidad_intro_titulo, oportunidad_intro_texto_1, oportunidad_intro_texto_2, oportunidad_intro_imagen, oportunidad_ventajas_titulo, oportunidad_ventajas_texto, oportunidad_producto_titulo, oportunidad_producto_texto, oportunidad_producto_bullets, oportunidad_producto_imagen, oportunidad_pasos_titulo, oportunidad_paso1_titulo, oportunidad_paso1_texto, oportunidad_paso2_titulo, oportunidad_paso2_texto, oportunidad_paso3_titulo, oportunidad_paso3_texto, oportunidad_postular_titulo, oportunidad_postular_texto_1, oportunidad_postular_texto_2"
        )
        .eq("id", 1)
        .single(),
      supabase.from("oportunidad_ventajas").select("*").order("orden", { ascending: true }),
      supabase.from("distribuidores_leads").select("*").order("created_at", { ascending: false }),
    ]);
    setTextos(config as TextosOportunidad);
    setVentajas((ventajasData as OportunidadVentaja[]) ?? []);
    setLeads((leadsData as DistribuidorLead[]) ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function actualizar<K extends keyof TextosOportunidad>(campo: K, valor: TextosOportunidad[K]) {
    setTextos((t) => (t ? { ...t, [campo]: valor } : t));
    setGuardado(false);
  }

  async function subirImagen(
    campo: "oportunidad_hero_imagen" | "oportunidad_intro_imagen" | "oportunidad_producto_imagen",
    file: File
  ) {
    setSubiendo(true);
    const supabase = createClient();
    const path = `oportunidad/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("productos-web-fotos").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("productos-web-fotos").getPublicUrl(path);
      actualizar(campo, data.publicUrl);
    }
    setSubiendo(false);
  }

  async function guardarTextos() {
    if (!textos) return;
    setGuardando(true);
    await createClient().from("configuracion_sitio").update(textos).eq("id", 1);
    setGuardando(false);
    setGuardado(true);
  }

  function cerrarVentaja() {
    setEditando(null);
    setCreando(false);
  }

  async function recargarYCerrarVentaja() {
    await cargar();
    cerrarVentaja();
  }

  async function cambiarEstadoLead(id: string, estado: string) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, estado } : l)));
    await createClient().from("distribuidores_leads").update({ estado }).eq("id", id);
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h2 className="text-lg font-semibold">Oportunidad de negocio</h2>

      {!textos ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Hero</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Campo
                id="op-hero-titulo"
                label="Título del hero (H1)"
                value={textos.oportunidad_hero_titulo ?? ""}
                onChange={(v) => actualizar("oportunidad_hero_titulo", v)}
                textarea
              />
              <Campo
                id="op-hero-texto"
                label="Texto del hero"
                value={textos.oportunidad_hero_texto ?? ""}
                onChange={(v) => actualizar("oportunidad_hero_texto", v)}
                textarea
              />
              <CampoImagen
                id="op-hero-img"
                label="Imagen de fondo del hero"
                value={textos.oportunidad_hero_imagen ?? ""}
                subiendo={subiendo}
                onUpload={(file) => subirImagen("oportunidad_hero_imagen", file)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Introducción editorial</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Campo
                id="op-intro-titulo"
                label="Título"
                value={textos.oportunidad_intro_titulo ?? ""}
                onChange={(v) => actualizar("oportunidad_intro_titulo", v)}
              />
              <Campo
                id="op-intro-texto1"
                label="Primer párrafo"
                value={textos.oportunidad_intro_texto_1 ?? ""}
                onChange={(v) => actualizar("oportunidad_intro_texto_1", v)}
                textarea
              />
              <Campo
                id="op-intro-texto2"
                label="Segundo párrafo"
                value={textos.oportunidad_intro_texto_2 ?? ""}
                onChange={(v) => actualizar("oportunidad_intro_texto_2", v)}
                textarea
              />
              <CampoImagen
                id="op-intro-img"
                label="Imagen"
                value={textos.oportunidad_intro_imagen ?? ""}
                subiendo={subiendo}
                onUpload={(file) => subirImagen("oportunidad_intro_imagen", file)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Encabezado — Ventajas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Campo
                id="op-ventajas-titulo"
                label="Título de sección"
                value={textos.oportunidad_ventajas_titulo ?? ""}
                onChange={(v) => actualizar("oportunidad_ventajas_titulo", v)}
              />
              <Campo
                id="op-ventajas-texto"
                label="Texto de sección"
                value={textos.oportunidad_ventajas_texto ?? ""}
                onChange={(v) => actualizar("oportunidad_ventajas_texto", v)}
                textarea
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Banda de producto destacado</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Campo
                id="op-producto-titulo"
                label="Título"
                value={textos.oportunidad_producto_titulo ?? ""}
                onChange={(v) => actualizar("oportunidad_producto_titulo", v)}
              />
              <Campo
                id="op-producto-texto"
                label="Texto"
                value={textos.oportunidad_producto_texto ?? ""}
                onChange={(v) => actualizar("oportunidad_producto_texto", v)}
                textarea
              />
              <Campo
                id="op-producto-bullets"
                label="Lista de puntos (uno por línea)"
                value={textos.oportunidad_producto_bullets ?? ""}
                onChange={(v) => actualizar("oportunidad_producto_bullets", v)}
                textarea
                rows={4}
              />
              <CampoImagen
                id="op-producto-img"
                label="Imagen del producto"
                value={textos.oportunidad_producto_imagen ?? ""}
                subiendo={subiendo}
                onUpload={(file) => subirImagen("oportunidad_producto_imagen", file)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Cómo empezar (3 pasos)</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Campo
                id="op-pasos-titulo"
                label="Título de sección"
                value={textos.oportunidad_pasos_titulo ?? ""}
                onChange={(v) => actualizar("oportunidad_pasos_titulo", v)}
              />
              {(["1", "2", "3"] as const).map((n) => (
                <div key={n} className="grid gap-4 rounded-md border p-3">
                  <p className="text-xs font-semibold text-muted-foreground">Paso {n}</p>
                  <Campo
                    id={`op-paso${n}-titulo`}
                    label="Título"
                    value={textos[`oportunidad_paso${n}_titulo` as keyof TextosOportunidad] ?? ""}
                    onChange={(v) => actualizar(`oportunidad_paso${n}_titulo` as keyof TextosOportunidad, v)}
                  />
                  <Campo
                    id={`op-paso${n}-texto`}
                    label="Texto"
                    value={textos[`oportunidad_paso${n}_texto` as keyof TextosOportunidad] ?? ""}
                    onChange={(v) => actualizar(`oportunidad_paso${n}_texto` as keyof TextosOportunidad, v)}
                    textarea
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Formulario de postulación</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Campo
                id="op-postular-titulo"
                label="Título"
                value={textos.oportunidad_postular_titulo ?? ""}
                onChange={(v) => actualizar("oportunidad_postular_titulo", v)}
              />
              <Campo
                id="op-postular-texto1"
                label="Primer párrafo"
                value={textos.oportunidad_postular_texto_1 ?? ""}
                onChange={(v) => actualizar("oportunidad_postular_texto_1", v)}
                textarea
              />
              <Campo
                id="op-postular-texto2"
                label="Segundo párrafo"
                value={textos.oportunidad_postular_texto_2 ?? ""}
                onChange={(v) => actualizar("oportunidad_postular_texto_2", v)}
                textarea
              />
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button onClick={guardarTextos} disabled={guardando || subiendo} className="w-fit">
              {guardando ? "Guardando…" : "Guardar cambios"}
            </Button>
            {guardado && <span className="text-sm text-green-600">Guardado ✓</span>}
          </div>
        </>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Ventajas (tarjetas de la web)</h3>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nueva ventaja
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Ícono</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!cargando && ventajas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Sin ventajas configuradas.
                  </TableCell>
                </TableRow>
              )}
              {ventajas.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.titulo}</TableCell>
                  <TableCell className="text-muted-foreground">{v.icono}</TableCell>
                  <TableCell className="text-muted-foreground">{v.orden}</TableCell>
                  <TableCell>
                    <Badge color={v.activo ? "verde" : "gris"}>{v.activo ? "Activo" : "Inactivo"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditando(v)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {(creando || editando) && (
        <VentajaForm ventaja={editando} onClose={cerrarVentaja} onSaved={recargarYCerrarVentaja} />
      )}

      <h3 className="text-base font-semibold">Postulaciones recibidas</h3>

      <TableCard badge={<Badge color="gris">{leads.length}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Ocupación</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && leads.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Sin postulaciones todavía.
                </TableCell>
              </TableRow>
            )}
            {leads.map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  {l.nombre}
                  {l.email && <span className="block text-xs text-muted-foreground/70">{l.email}</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">{l.telefono}</TableCell>
                <TableCell className="text-muted-foreground">{l.ciudad || "—"}</TableCell>
                <TableCell className="max-w-xs text-muted-foreground">{l.experiencia || "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(l.created_at).toLocaleDateString("es-PE")}
                </TableCell>
                <TableCell>
                  <Select value={l.estado} onValueChange={(v) => cambiarEstadoLead(l.id, v)}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_LEAD.map((estado) => (
                        <SelectItem key={estado} value={estado}>
                          {estado.charAt(0).toUpperCase() + estado.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>
    </div>
  );
}
