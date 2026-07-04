import { createClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/lib/data/blog-shared";

export type { BlogPost } from "@/lib/data/blog-shared";
export { formatFechaPost } from "@/lib/data/blog-shared";

const LISTADO_FIELDS =
  "id, slug, titulo, fecha_publicacion, resumen, imagen_destacada, producto_slug, estado";

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select(LISTADO_FIELDS)
    .eq("estado", "publicado")
    .order("fecha_publicacion", { ascending: false });
  return (data as BlogPost[]) ?? [];
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("estado", "publicado")
    .single();
  return (data as BlogPost) ?? null;
}

export async function getRelatedPosts(slugActual: string, productoSlug: string | null) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select(LISTADO_FIELDS)
    .eq("estado", "publicado")
    .neq("slug", slugActual)
    .order("fecha_publicacion", { ascending: false })
    .limit(5);

  const posts = (data as BlogPost[]) ?? [];
  if (!productoSlug) return posts.slice(0, 4);

  // Prioriza posts del mismo producto, igual que la referencia de SUSEGUR
  // (blogs/blog.html) — completa con los mas recientes.
  const mismoProducto = posts.filter((p) => p.producto_slug === productoSlug);
  const otros = posts.filter((p) => p.producto_slug !== productoSlug);
  return [...mismoProducto, ...otros].slice(0, 4);
}
