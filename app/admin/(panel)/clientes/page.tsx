"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { SortableTableHead } from "@/components/admin/table/SortableTableHead";
import { TableCard } from "@/components/admin/table/TableCard";
import { TablePagination } from "@/components/admin/table/TablePagination";
import { useTableRows } from "@/components/admin/table/useTableRows";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BADGE_NIVEL, formatFecha, nivelLabel, type ClienteResumen } from "@/lib/data/clientes-admin";

function valorOrden(c: ClienteResumen, columna: string) {
  switch (columna) {
    case "nombre":
      return c.nombre || c.apellido ? `${c.nombre ?? ""} ${c.apellido ?? ""}`.trim() : "Sin nombre";
    case "email":
      return c.email;
    case "nivel":
      return c.nivel ?? "basico";
    case "total_compras":
      return c.total_compras ?? 0;
    case "ultima_compra":
      return c.ultima_compra_at ?? "";
    default:
      return null;
  }
}

export default function AdminClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<ClienteResumen[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    createClient()
      .from("admin_clientes_resumen")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setClientes((data as ClienteResumen[]) ?? []);
        setCargando(false);
      });
  }, []);

  const { pageRows, totalRows, page, totalPages, setPage, sortColumn, sortDirection, toggleSort } = useTableRows({
    rows: clientes,
    getSortValue: valorOrden,
  });

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">Clientes</h2>

      <TableCard badge={<Badge color="gris">{totalRows}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnId="nombre" label="Nombre" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="email" label="Email" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead>Teléfono</TableHead>
              <SortableTableHead columnId="nivel" label="Nivel" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="total_compras" label="Total compras" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="ultima_compra" label="Última compra" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && clientes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Sin clientes registrados todavía.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((c) => (
              <TableRow
                key={c.id}
                className="cursor-pointer"
                onClick={() => router.push(`/admin/clientes/${c.id}`)}
              >
                <TableCell>
                  <Link
                    href={`/admin/clientes/${c.id}`}
                    className="font-medium text-secondary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {c.nombre || c.apellido ? `${c.nombre ?? ""} ${c.apellido ?? ""}`.trim() : "Sin nombre"}
                  </Link>
                </TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell className="text-muted-foreground">{c.telefono ?? "—"}</TableCell>
                <TableCell>
                  <Badge color={BADGE_NIVEL[c.nivel ?? "basico"] ?? "gris"}>{nivelLabel(c.nivel)}</Badge>
                </TableCell>
                <TableCell>{c.total_compras ?? 0}</TableCell>
                <TableCell className="text-muted-foreground">{formatFecha(c.ultima_compra_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination page={page} totalPages={totalPages} totalRows={totalRows} onPageChange={setPage} />
      </TableCard>
    </div>
  );
}
