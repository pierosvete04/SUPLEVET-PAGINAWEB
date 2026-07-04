"use client";

import { useEffect, useState, use as usePromise } from "react";
import { createClient } from "@/lib/supabase/client";
import { PostEditor } from "@/components/admin/blog/PostEditor";
import type { BlogPost } from "@/lib/data/blog-shared";

export default function AdminBlogEditarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [post, setPost] = useState<BlogPost | null | undefined>(undefined);

  useEffect(() => {
    createClient()
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => setPost((data as BlogPost) ?? null));
  }, [id]);

  if (post === undefined) return <p className="font-body text-sm text-muted-foreground">Cargando…</p>;
  if (post === null) return <p className="font-body text-sm text-muted-foreground">Post no encontrado.</p>;

  return <PostEditor post={post} />;
}
