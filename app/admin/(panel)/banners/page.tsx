"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Plus, GalleryHorizontal } from "lucide-react";
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
import { BannerForm } from "@/components/admin/banners/BannerForm";
import type { Banner } from "@/lib/banners";

const LABEL_PAGINA: Record<Banner["pagina"], string> = {
  productos: "Productos",
  ofertas: "Ofertas",
  ambas: "Productos y Ofertas",
  home: "Nuevas presentaciones (Home)",
  hero: "Banner principal (Hero)",
};

function valorOrden(b: Banner, columna: string) {
  switch (columna) {
    case "pagina":
      return LABEL_PAGINA[b.pagina];
    case "orden":
      return b.orden;
    case "estado":
      return b.activo ? 1 : 0;
    default:
      return null;
  }
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<Banner | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("banners")
      .select("*")
      .order("orden", { ascending: true });
    setBanners((data as Banner[]) ?? []);
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
    rows: banners,
    getSortValue: valorOrden,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Banners</h2>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Nuevo banner
        </Button>
      </div>

      <TableCard badge={<Badge color="gris">{totalRows}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Banner</TableHead>
              <SortableTableHead columnId="pagina" label="Página" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="orden" label="Orden" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="estado" label="Estado" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead className="px-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && banners.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Sin banners configurados.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <div className="relative flex h-10 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-soft-gray">
                    {b.imagen ? (
                      <Image src={b.imagen} alt="" fill className="object-cover" sizes="80px" />
                    ) : (
                      <GalleryHorizontal className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{LABEL_PAGINA[b.pagina]}</TableCell>
                <TableCell className="text-muted-foreground">{b.orden}</TableCell>
                <TableCell>
                  <Badge color={b.activo ? "verde" : "gris"}>{b.activo ? "Activo" : "Inactivo"}</Badge>
                </TableCell>
                <TableCell className="px-4">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditando(b)}>
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
        <BannerForm banner={editando} onClose={cerrar} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
