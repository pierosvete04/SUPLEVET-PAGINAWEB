"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { SortableTableHead } from "@/components/admin/table/SortableTableHead";
import { TableCard } from "@/components/admin/table/TableCard";
import { TablePagination } from "@/components/admin/table/TablePagination";
import { useTableRows } from "@/components/admin/table/useTableRows";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SuplepuntosConfig, TipoSuplepuntosConfig } from "@/lib/data/portal/puntos";
import { SuplepuntosConfigForm } from "@/components/admin/suplepuntos/SuplepuntosConfigForm";

const TIPO_LABEL: Record<TipoSuplepuntosConfig, string> = {
  accion: "Forma de ganar",
  canje_descuento: "Canje: descuento",
  canje_envio: "Canje: envío",
  canje_producto: "Canje: producto",
  multiplicador: "Multiplicador",
};

const FILTROS: { valor: TipoSuplepuntosConfig | "todos"; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "accion", label: "Formas de ganar" },
  { valor: "canje_descuento", label: "Canjes: descuento" },
  { valor: "canje_envio", label: "Canjes: envío" },
  { valor: "canje_producto", label: "Canjes: producto" },
  { valor: "multiplicador", label: "Multiplicadores" },
];

export default function AdminSuplepuntosPage() {
  const [items, setItems] = useState<SuplepuntosConfig[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<TipoSuplepuntosConfig | "todos">("todos");
  const [editando, setEditando] = useState<SuplepuntosConfig | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("suplepuntos_config")
      .select("*")
      .order("tipo", { ascending: true })
      .order("nombre", { ascending: true });
    setItems((data as SuplepuntosConfig[]) ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function cerrar() {
    setEditando(null);
    setCreando(false);
  }

  async function recargarYCerrar() {
    await cargar();
    cerrar();
  }

  const itemsFiltrados = useMemo(
    () => (filtro === "todos" ? items : items.filter((i) => i.tipo === filtro)),
    [items, filtro]
  );

  const { pageRows, totalRows, page, totalPages, setPage, sortColumn, sortDirection, toggleSort } = useTableRows({
    rows: itemsFiltrados,
    getSortValue: (i, columna) => {
      switch (columna) {
        case "nombre":
          return i.nombre;
        case "tipo":
          return TIPO_LABEL[i.tipo];
        case "estado":
          return i.activo ? 1 : 0;
        default:
          return null;
      }
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">SuplePoints</h2>
          <p className="text-sm text-muted-foreground">
            Formas de ganar puntos, catálogo de canjes y multiplicadores del portal de clientes.
          </p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nueva configuración
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            type="button"
            onClick={() => setFiltro(f.valor)}
            className={`rounded-[17px] px-4 py-1.5 text-sm font-medium transition-colors ${
              filtro === f.valor ? "bg-secondary text-white" : "bg-soft-gray text-muted-foreground hover:bg-soft-gray/70"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <TableCard badge={<Badge color="gris">{totalRows}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnId="nombre" label="Nombre" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="tipo" label="Tipo" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead>Clave</TableHead>
              <TableHead>Puntos</TableHead>
              <SortableTableHead columnId="estado" label="Estado" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead className="px-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && itemsFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Sin configuraciones para este filtro.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((i) => (
              <TableRow key={i.id}>
                <TableCell>
                  <span className="font-medium">{i.nombre}</span>
                  {i.descripcion && <p className="text-xs text-muted-foreground">{i.descripcion}</p>}
                </TableCell>
                <TableCell className="text-muted-foreground">{TIPO_LABEL[i.tipo]}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{i.clave}</TableCell>
                <TableCell className="text-muted-foreground">
                  {i.puntos_requeridos != null && `${i.puntos_requeridos} req.`}
                  {i.puntos_otorgados != null && `+${i.puntos_otorgados}`}
                  {i.multiplicador != null && `x${i.multiplicador}`}
                  {i.puntos_requeridos == null && i.puntos_otorgados == null && i.multiplicador == null && "—"}
                </TableCell>
                <TableCell>
                  <Badge color={i.activo ? "verde" : "gris"}>{i.activo ? "Activo" : "Inactivo"}</Badge>
                </TableCell>
                <TableCell className="px-4">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditando(i)}>
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

      {(creando || editando) && (
        <SuplepuntosConfigForm config={editando} onClose={cerrar} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
