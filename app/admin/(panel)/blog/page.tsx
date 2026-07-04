"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-body text-xl font-bold text-secondary">Blog</h1>
        <Link
          href="/admin/blog/nuevo"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-body text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nuevo post
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <table className="w-full font-body text-sm">
          <thead className="bg-soft-gray text-left text-xs font-bold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Autor</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {!cargando && posts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Sin posts todavía.
                </td>
              </tr>
            )}
            {posts.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 font-bold text-secondary">{p.titulo}</td>
                <td className="px-4 py-3">
                  <Badge color={p.estado === "publicado" ? "verde" : "gris"}>
                    {p.estado === "publicado" ? "Publicado" : "Borrador"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-secondary">{formatFechaPost(p.fecha_publicacion)}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.autor ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/blog/${p.id}`}
                    className="font-body text-sm font-bold text-primary hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
