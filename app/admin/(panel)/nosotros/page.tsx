"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { SortableTableHead } from "@/components/admin/table/SortableTableHead";
import { TableCard } from "@/components/admin/table/TableCard";
import { TablePagination } from "@/components/admin/table/TablePagination";
import { useTableRows } from "@/components/admin/table/useTableRows";
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
import { ValorForm } from "@/components/admin/nosotros/ValorForm";
import type { ValorNosotros } from "@/lib/valores-nosotros";

function valorOrden(v: ValorNosotros, columna: string) {
  switch (columna) {
    case "titulo":
      return v.titulo;
    case "orden":
      return v.orden;
    case "estado":
      return v.activo ? 1 : 0;
    default:
      return null;
  }
}

interface TextosNosotros {
  nosotros_hero_titulo: string | null;
  nosotros_hero_imagen: string | null;
  nosotros_quote: string | null;
  nosotros_origen_texto: string | null;
  nosotros_mision_texto: string | null;
  nosotros_vision_texto: string | null;
  nosotros_overlay_imagen: string | null;
  nosotros_overlay_titulo: string | null;
  nosotros_overlay_texto: string | null;
}

function Campo({
  id,
  label,
  value,
  onChange,
  textarea = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {textarea ? (
        <Textarea id={id} rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

export default function AdminNosotrosPage() {
  const [valores, setValores] = useState<ValorNosotros[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<ValorNosotros | null>(null);
  const [creando, setCreando] = useState(false);

  const [textos, setTextos] = useState<TextosNosotros | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const supabase = createClient();
    const [{ data: valoresData }, { data: config }] = await Promise.all([
      supabase.from("valores_nosotros").select("*").order("orden", { ascending: true }),
      supabase
        .from("configuracion_sitio")
        .select(
          "nosotros_hero_titulo, nosotros_hero_imagen, nosotros_quote, nosotros_origen_texto, nosotros_mision_texto, nosotros_vision_texto, nosotros_overlay_imagen, nosotros_overlay_titulo, nosotros_overlay_texto"
        )
        .eq("id", 1)
        .single(),
    ]);
    setValores((valoresData as ValorNosotros[]) ?? []);
    setTextos(config as TextosNosotros);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function actualizar<K extends keyof TextosNosotros>(campo: K, valor: TextosNosotros[K]) {
    setTextos((t) => (t ? { ...t, [campo]: valor } : t));
    setGuardado(false);
  }

  async function subirImagen(campo: "nosotros_hero_imagen" | "nosotros_overlay_imagen", file: File) {
    setSubiendo(true);
    const supabase = createClient();
    const path = `nosotros/${Date.now()}-${file.name}`;
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

  function cerrar() {
    setEditando(null);
    setCreando(false);
  }

  async function recargarYCerrar() {
    await cargar();
    cerrar();
  }

  const { pageRows, totalRows, page, totalPages, setPage, sortColumn, sortDirection, toggleSort } = useTableRows({
    rows: valores,
    getSortValue: valorOrden,
  });

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h2 className="text-lg font-semibold">Nosotros</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Hero y textos institucionales</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!textos ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <>
              <Campo
                id="n-hero-titulo"
                label="Título del hero (H1)"
                value={textos.nosotros_hero_titulo ?? ""}
                onChange={(v) => actualizar("nosotros_hero_titulo", v)}
                textarea
              />
              <div className="grid gap-1.5">
                <Label htmlFor="n-hero-img">Imagen de fondo del hero</Label>
                <Input
                  id="n-hero-img"
                  type="file"
                  accept="image/*"
                  disabled={subiendo}
                  onChange={(e) => e.target.files?.[0] && subirImagen("nosotros_hero_imagen", e.target.files[0])}
                />
                {textos.nosotros_hero_imagen && (
                  <div className="relative h-32 w-full max-w-sm overflow-hidden rounded-md border">
                    <Image src={textos.nosotros_hero_imagen} alt="" fill className="object-cover" sizes="384px" />
                  </div>
                )}
              </div>
              <Campo
                id="n-quote"
                label="Frase destacada"
                value={textos.nosotros_quote ?? ""}
                onChange={(v) => actualizar("nosotros_quote", v)}
                textarea
              />
              <Campo
                id="n-origen"
                label="Texto — Nuestro Origen"
                value={textos.nosotros_origen_texto ?? ""}
                onChange={(v) => actualizar("nosotros_origen_texto", v)}
                textarea
              />
              <Campo
                id="n-mision"
                label="Texto — Nuestra Misión"
                value={textos.nosotros_mision_texto ?? ""}
                onChange={(v) => actualizar("nosotros_mision_texto", v)}
                textarea
              />
              <Campo
                id="n-vision"
                label="Texto — Nuestra Visión"
                value={textos.nosotros_vision_texto ?? ""}
                onChange={(v) => actualizar("nosotros_vision_texto", v)}
                textarea
              />
              <Campo
                id="n-overlay-titulo"
                label="Título del bloque con foto (overlay)"
                value={textos.nosotros_overlay_titulo ?? ""}
                onChange={(v) => actualizar("nosotros_overlay_titulo", v)}
              />
              <Campo
                id="n-overlay-texto"
                label="Texto del bloque con foto (overlay)"
                value={textos.nosotros_overlay_texto ?? ""}
                onChange={(v) => actualizar("nosotros_overlay_texto", v)}
              />
              <div className="grid gap-1.5">
                <Label htmlFor="n-overlay-img">Imagen del bloque con foto</Label>
                <Input
                  id="n-overlay-img"
                  type="file"
                  accept="image/*"
                  disabled={subiendo}
                  onChange={(e) =>
                    e.target.files?.[0] && subirImagen("nosotros_overlay_imagen", e.target.files[0])
                  }
                />
                {textos.nosotros_overlay_imagen && (
                  <div className="relative h-32 w-full max-w-sm overflow-hidden rounded-md border">
                    <Image
                      src={textos.nosotros_overlay_imagen}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="384px"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={guardarTextos} disabled={guardando || subiendo} className="w-fit">
                  {guardando ? "Guardando…" : "Guardar cambios"}
                </Button>
                {guardado && <span className="text-sm text-green-600">Guardado ✓</span>}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Nuestros Valores</h3>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nuevo valor
        </Button>
      </div>

      <TableCard badge={<Badge color="gris">{totalRows}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnId="titulo" label="Título" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead>Ícono</TableHead>
              <SortableTableHead columnId="orden" label="Orden" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="estado" label="Estado" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead className="px-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && valores.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Sin valores configurados.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((v) => (
              <TableRow key={v.id}>
                <TableCell>{v.titulo}</TableCell>
                <TableCell className="text-muted-foreground">{v.icono}</TableCell>
                <TableCell className="text-muted-foreground">{v.orden}</TableCell>
                <TableCell>
                  <Badge color={v.activo ? "verde" : "gris"}>{v.activo ? "Activo" : "Inactivo"}</Badge>
                </TableCell>
                <TableCell className="px-4">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditando(v)}>
                      Editar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination page={page} totalPages={totalPages} totalRows={totalRows} onPageChange={setPage} />
      </TableCard>

      {(creando || editando) && <ValorForm valor={editando} onClose={cerrar} onSaved={recargarYCerrar} />}
    </div>
  );
}
