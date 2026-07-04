"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatFechaPost, type BlogPost } from "@/lib/data/blog-shared";

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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead />
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
              {posts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.titulo}</TableCell>
                  <TableCell>
                    <Badge color={p.estado === "publicado" ? "verde" : "gris"}>
                      {p.estado === "publicado" ? "Publicado" : "Borrador"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatFechaPost(p.fecha_publicacion)}</TableCell>
                  <TableCell className="text-muted-foreground">{p.autor ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/blog/${p.id}`}>Editar</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
