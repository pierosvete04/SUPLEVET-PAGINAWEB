"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { formatFechaPost, type BlogPost } from "@/lib/data/blog-shared";

function valorOrden(p: BlogPost, columna: string) {
  switch (columna) {
    case "titulo":
      return p.titulo;
    case "estado":
      return p.estado;
    case "fecha":
      return p.fecha_publicacion ?? "";
    case "autor":
      return p.autor ?? "";
    default:
      return null;
  }
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    createClient()
      .from("blog_posts")
      .select("*")
      .order("fecha_publicacion", { ascending: false })
      .then(({ data }) => {
        setPosts((data as BlogPost[]) ?? []);
        setCargando(false);
      });
  }, []);

  const { pageRows, totalRows, page, totalPages, setPage, sortColumn, sortDirection, toggleSort } = useTableRows({
    rows: posts,
    getSortValue: valorOrden,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Blog</h2>
        <Button asChild>
          <Link href="/admin/blog/nuevo">
            <Plus className="h-4 w-4" /> Nuevo post
          </Link>
        </Button>
      </div>

      <TableCard badge={<Badge color="gris">{totalRows}</Badge>}>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnId="titulo" label="Título" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} className="w-full max-w-1/3" />
              <SortableTableHead columnId="estado" label="Estado" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="fecha" label="Fecha" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="autor" label="Autor" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead className="px-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && posts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Sin posts todavía.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.titulo}</TableCell>
                <TableCell>
                  <Badge color={p.estado === "publicado" ? "verde" : "gris"}>
                    {p.estado === "publicado" ? "Publicado" : "Borrador"}
                  </Badge>
                </TableCell>
                <TableCell>{formatFechaPost(p.fecha_publicacion)}</TableCell>
                <TableCell className="text-muted-foreground">{p.autor ?? "—"}</TableCell>
                <TableCell className="px-4">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/blog/${p.id}`}>Editar</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination page={page} totalPages={totalPages} totalRows={totalRows} onPageChange={setPage} />
      </TableCard>
    </div>
  );
}
