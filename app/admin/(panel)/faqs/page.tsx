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
import { FaqForm } from "@/components/admin/faqs/FaqForm";
import type { Faq } from "@/lib/faqs";

function valorOrden(f: Faq, columna: string) {
  switch (columna) {
    case "pregunta":
      return f.pregunta;
    case "orden":
      return f.orden;
    case "estado":
      return f.activo ? 1 : 0;
    default:
      return null;
  }
}

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<Faq | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("faqs")
      .select("*")
      .order("orden", { ascending: true });
    setFaqs((data as Faq[]) ?? []);
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
    rows: faqs,
    getSortValue: valorOrden,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">FAQs</h2>
          <p className="text-sm text-muted-foreground">
            Preguntas frecuentes mostradas en Inicio y en la página de cada producto.
          </p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nueva pregunta
        </Button>
      </div>

      <TableCard badge={<Badge color="gris">{totalRows}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnId="pregunta" label="Pregunta" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} className="w-full max-w-md" />
              <SortableTableHead columnId="orden" label="Orden" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="estado" label="Estado" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead className="px-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && faqs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Sin preguntas configuradas.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="max-w-md">{f.pregunta}</TableCell>
                <TableCell className="text-muted-foreground">{f.orden}</TableCell>
                <TableCell>
                  <Badge color={f.activo ? "verde" : "gris"}>{f.activo ? "Activa" : "Inactiva"}</Badge>
                </TableCell>
                <TableCell className="px-4">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditando(f)}>
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

      {(creando || editando) && <FaqForm faq={editando} onClose={cerrar} onSaved={recargarYCerrar} />}
    </div>
  );
}
