"use client";

import { useCallback, useEffect, useState } from "react";
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
import { CuponForm, type Cupon } from "@/components/admin/cupones/CuponForm";

const LABEL_TIPO: Record<Cupon["tipo"], string> = {
  envio_gratis: "Envío gratis",
  pct_envio: "% envío",
  pct_producto: "% producto",
  monto_fijo_producto: "Monto fijo producto",
};

function valorOrden(c: Cupon, columna: string) {
  switch (columna) {
    case "codigo":
      return c.codigo;
    case "tipo":
      return LABEL_TIPO[c.tipo];
    case "usos":
      return c.usos_actuales;
    case "estado":
      return c.activo ? 1 : 0;
    default:
      return null;
  }
}

export default function AdminCuponesPage() {
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<Cupon | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("cupones")
      .select("*")
      .order("created_at", { ascending: false });
    setCupones((data as Cupon[]) ?? []);
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

  const { pageRows, totalRows, page, totalPages, setPage, sortColumn, sortDirection, toggleSort } = useTableRows({
    rows: cupones,
    getSortValue: valorOrden,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cupones</h2>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nuevo cupón
        </Button>
      </div>

      <TableCard badge={<Badge color="gris">{totalRows}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnId="codigo" label="Código" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="tipo" label="Tipo" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead>Valor</TableHead>
              <TableHead>Condiciones</TableHead>
              <SortableTableHead columnId="usos" label="Usos" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="estado" label="Estado" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead className="px-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && cupones.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Sin cupones todavía.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.codigo}</TableCell>
                <TableCell>{LABEL_TIPO[c.tipo]}</TableCell>
                <TableCell>
                  {c.tipo === "envio_gratis"
                    ? "—"
                    : c.tipo.startsWith("pct")
                      ? `${c.valor}%`
                      : `S/.${c.valor.toFixed(2)}`}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.monto_minimo > 0 ? `Compra ≥ S/.${c.monto_minimo.toFixed(2)}` : "Sin mínimo"}
                </TableCell>
                <TableCell>
                  {c.usos_actuales} / {c.usos_maximos ?? "∞"}
                </TableCell>
                <TableCell>
                  <Badge color={c.activo ? "verde" : "gris"}>{c.activo ? "Activo" : "Inactivo"}</Badge>
                </TableCell>
                <TableCell className="px-4">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditando(c)}>
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
        <CuponForm cupon={editando} onClose={cerrar} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
