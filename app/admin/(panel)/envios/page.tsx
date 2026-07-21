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
import { ZonaForm } from "@/components/admin/envios/ZonaForm";
import { DistritoForm } from "@/components/admin/envios/DistritoForm";
import type { EnvioDistrito, EnvioZona } from "@/lib/shipping";

function valorOrdenZona(z: EnvioZona, columna: string) {
  switch (columna) {
    case "zona":
      return z.nombre;
    case "costo":
      return z.costo_envio;
    case "gratis_desde":
      return z.monto_minimo_gratis;
    case "estado":
      return z.activo ? 1 : 0;
    default:
      return null;
  }
}

function valorOrdenDistrito(d: EnvioDistrito, zonas: EnvioZona[], columna: string) {
  switch (columna) {
    case "distrito":
      return d.distrito;
    case "zona":
      return zonas.find((z) => z.id === d.zona_id)?.nombre ?? "";
    case "costo":
      return d.costo_envio;
    case "estado":
      return d.activo ? 1 : 0;
    default:
      return null;
  }
}

export default function AdminEnviosPage() {
  const [zonas, setZonas] = useState<EnvioZona[]>([]);
  const [distritos, setDistritos] = useState<EnvioDistrito[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<EnvioZona | null>(null);
  const [creando, setCreando] = useState(false);
  const [editandoDistrito, setEditandoDistrito] = useState<EnvioDistrito | null>(null);
  const [creandoDistrito, setCreandoDistrito] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const supabase = createClient();
    const [{ data: zonasData }, { data: distritosData }] = await Promise.all([
      supabase.from("envio_zonas").select("*").order("orden", { ascending: true }),
      supabase.from("envio_distritos").select("*").order("distrito", { ascending: true }),
    ]);
    setZonas((zonasData as EnvioZona[]) ?? []);
    setDistritos((distritosData as EnvioDistrito[]) ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function cerrar() {
    setEditando(null);
    setCreando(false);
  }

  function cerrarDistrito() {
    setEditandoDistrito(null);
    setCreandoDistrito(false);
  }

  async function recargarYCerrar() {
    await cargar();
    cerrar();
  }

  async function recargarYCerrarDistrito() {
    await cargar();
    cerrarDistrito();
  }

  const tablaZonas = useTableRows({ rows: zonas, getSortValue: valorOrdenZona });
  const tablaDistritos = useTableRows({
    rows: distritos,
    getSortValue: (d, columna) => valorOrdenDistrito(d, zonas, columna),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Zonas de envío</h2>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nueva zona
        </Button>
      </div>

      <TableCard badge={<Badge color="gris">{tablaZonas.totalRows}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnId="zona" label="Zona" activeColumn={tablaZonas.sortColumn} direction={tablaZonas.sortDirection} onSort={tablaZonas.toggleSort} />
              <TableHead>Departamentos</TableHead>
              <TableHead>Tiempo</TableHead>
              <SortableTableHead columnId="costo" label="Costo" activeColumn={tablaZonas.sortColumn} direction={tablaZonas.sortDirection} onSort={tablaZonas.toggleSort} />
              <SortableTableHead columnId="gratis_desde" label="Gratis desde" activeColumn={tablaZonas.sortColumn} direction={tablaZonas.sortDirection} onSort={tablaZonas.toggleSort} />
              <SortableTableHead columnId="estado" label="Estado" activeColumn={tablaZonas.sortColumn} direction={tablaZonas.sortDirection} onSort={tablaZonas.toggleSort} />
              <TableHead className="px-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && zonas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Sin zonas configuradas.
                </TableCell>
              </TableRow>
            )}
            {tablaZonas.pageRows.map((z) => (
              <TableRow key={z.id} className="align-top">
                <TableCell className="font-medium">{z.nombre}</TableCell>
                <TableCell className="max-w-xs text-muted-foreground">
                  {z.departamentos.join(", ")}
                </TableCell>
                <TableCell>{z.tiempo_estimado}</TableCell>
                <TableCell>S/.{z.costo_envio.toFixed(2)}</TableCell>
                <TableCell>S/.{z.monto_minimo_gratis.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge color={z.activo ? "verde" : "gris"}>{z.activo ? "Activa" : "Inactiva"}</Badge>
                </TableCell>
                <TableCell className="px-4">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditando(z)}>
                      Editar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          page={tablaZonas.page}
          totalPages={tablaZonas.totalPages}
          totalRows={tablaZonas.totalRows}
          onPageChange={tablaZonas.setPage}
        />
      </TableCard>

      {(creando || editando) && (
        <ZonaForm zona={editando} onClose={cerrar} onSaved={recargarYCerrar} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tarifas por distrito</h2>
          <p className="text-sm text-muted-foreground">
            Override del costo de envío para distritos puntuales (courier Dinsides). Si un distrito no
            aparece aquí, usa el costo plano de su zona.
          </p>
        </div>
        <Button onClick={() => setCreandoDistrito(true)}>
          <Plus className="h-4 w-4" /> Nuevo distrito
        </Button>
      </div>

      <TableCard badge={<Badge color="gris">{tablaDistritos.totalRows}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnId="distrito" label="Distrito" activeColumn={tablaDistritos.sortColumn} direction={tablaDistritos.sortDirection} onSort={tablaDistritos.toggleSort} />
              <SortableTableHead columnId="zona" label="Zona" activeColumn={tablaDistritos.sortColumn} direction={tablaDistritos.sortDirection} onSort={tablaDistritos.toggleSort} />
              <SortableTableHead columnId="costo" label="Costo" activeColumn={tablaDistritos.sortColumn} direction={tablaDistritos.sortDirection} onSort={tablaDistritos.toggleSort} />
              <SortableTableHead columnId="estado" label="Estado" activeColumn={tablaDistritos.sortColumn} direction={tablaDistritos.sortDirection} onSort={tablaDistritos.toggleSort} />
              <TableHead className="px-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && distritos.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Sin tarifas de distrito configuradas.
                </TableCell>
              </TableRow>
            )}
            {tablaDistritos.pageRows.map((d) => (
              <TableRow key={d.id} className="align-top">
                <TableCell className="font-medium">{d.distrito}</TableCell>
                <TableCell className="text-muted-foreground">
                  {zonas.find((z) => z.id === d.zona_id)?.nombre ?? "—"}
                </TableCell>
                <TableCell>S/.{d.costo_envio.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge color={d.activo ? "verde" : "gris"}>{d.activo ? "Activo" : "Inactivo"}</Badge>
                </TableCell>
                <TableCell className="px-4">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditandoDistrito(d)}>
                      Editar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          page={tablaDistritos.page}
          totalPages={tablaDistritos.totalPages}
          totalRows={tablaDistritos.totalRows}
          onPageChange={tablaDistritos.setPage}
        />
      </TableCard>

      {(creandoDistrito || editandoDistrito) && (
        <DistritoForm
          distrito={editandoDistrito}
          zonas={zonas}
          onClose={cerrarDistrito}
          onSaved={recargarYCerrarDistrito}
        />
      )}
    </div>
  );
}
