"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { Heart, PawPrint, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatFecha } from "@/lib/portal/formato";
import type { Post, PerfilComunidad } from "@/lib/data/portal/comunidad";
import { BrandedLoader } from "@/components/ui/branded-loader";

interface PostConAutor extends Post {
  autor: PerfilComunidad | null;
  likes: number;
  meGusta: boolean;
}

interface ComunidadFeedProps {
  user: User;
}

export function ComunidadFeed({ user }: ComunidadFeedProps) {
  const [posts, setPosts] = useState<PostConAutor[]>([]);
  const [texto, setTexto] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [publicando, setPublicando] = useState(false);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    const supabase = createClient();
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    const lista = (postsData as Post[]) ?? [];
    const clienteIds = [...new Set(lista.map((p) => p.cliente_id))];

    const [{ data: perfiles }, { data: likes }] = await Promise.all([
      clienteIds.length
        ? supabase.from("v_comunidad_perfiles").select("*").in("cliente_id", clienteIds)
        : Promise.resolve({ data: [] as PerfilComunidad[] }),
      lista.length
        ? supabase
            .from("post_likes")
            .select("post_id, cliente_id")
            .in(
              "post_id",
              lista.map((p) => p.id)
            )
        : Promise.resolve({ data: [] as { post_id: string; cliente_id: string }[] }),
    ]);

    const perfilesPorId = new Map((perfiles ?? []).map((p) => [p.cliente_id, p]));
    const likesPorPost = new Map<string, number>();
    const misLikes = new Set<string>();
    for (const l of likes ?? []) {
      likesPorPost.set(l.post_id, (likesPorPost.get(l.post_id) ?? 0) + 1);
      if (l.cliente_id === user.id) misLikes.add(l.post_id);
    }

    setPosts(
      lista.map((p) => ({
        ...p,
        autor: perfilesPorId.get(p.cliente_id) ?? null,
        likes: likesPorPost.get(p.id) ?? 0,
        meGusta: misLikes.has(p.id),
      }))
    );
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  async function publicar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setPublicando(true);
    const supabase = createClient();
    let fotoUrls: string[] = [];
    if (fotoFile) {
      const path = `${user.id}/posts/${Date.now()}-${fotoFile.name}`;
      const { error } = await supabase.storage.from("comunidad-fotos").upload(path, fotoFile);
      if (!error) {
        const { data } = supabase.storage.from("comunidad-fotos").getPublicUrl(path);
        fotoUrls = [data.publicUrl];
      }
    }
    await supabase.from("posts").insert({ cliente_id: user.id, texto: texto.trim(), foto_urls: fotoUrls });
    setTexto("");
    setFotoFile(null);
    setPublicando(false);
    cargar();
  }

  async function alternarLike(post: PostConAutor) {
    const supabase = createClient();
    if (post.meGusta) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("cliente_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, cliente_id: user.id });
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, meGusta: !p.meGusta, likes: p.likes + (p.meGusta ? -1 : 1) } : p
      )
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <form onSubmit={publicar} className="rounded-[var(--radius-card)] bg-white p-4 shadow-sm">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Comparte algo sobre tu mascota…"
          rows={2}
          className="w-full resize-none rounded-lg bg-soft-gray p-3 font-body text-sm text-secondary"
        />
        <div className="mt-2 flex items-center justify-between">
          <label className="cursor-pointer font-body text-xs font-bold text-muted-foreground">
            {fotoFile ? fotoFile.name : "+ Foto (opcional)"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFotoFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button
            type="submit"
            disabled={publicando || !texto.trim()}
            className="flex items-center gap-1.5 rounded-[17px] bg-primary px-4 py-2 font-body text-xs font-bold text-primary-foreground disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> {publicando ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </form>

      {cargando ? (
        <BrandedLoader />
      ) : posts.length === 0 ? (
        <div className="rounded-[var(--radius-card)] bg-white p-8 text-center shadow-sm">
          <PawPrint className="mx-auto h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
          <p className="mt-2 font-body text-sm font-bold text-secondary">Sin publicaciones aún</p>
          <p className="font-body text-xs text-muted-foreground">Sé el primero en compartir algo.</p>
        </div>
      ) : (
        posts.map((p) => (
          <div key={p.id} className="rounded-[var(--radius-card)] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/30 font-body text-sm font-bold text-secondary">
                {p.autor?.foto_url ? (
                  <Image src={p.autor.foto_url} alt="" width={36} height={36} className="h-full w-full object-cover" />
                ) : (
                  (p.autor?.nombre_display ?? "?").charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-sm font-bold text-secondary">
                  {p.autor?.nombre_display ?? "Cliente Suplevet"}
                </p>
                <p className="font-body text-[10px] text-muted-foreground">{formatFecha(p.created_at)}</p>
              </div>
            </div>
            <p className="mt-3 font-body text-sm text-secondary">{p.texto}</p>
            {p.foto_urls.length > 0 && (
              <div className="relative mt-3 aspect-video overflow-hidden rounded-lg">
                <Image src={p.foto_urls[0]} alt="" fill className="object-cover" sizes="500px" />
              </div>
            )}
            <button
              type="button"
              onClick={() => alternarLike(p)}
              className="mt-3 flex items-center gap-1.5 font-body text-xs font-bold text-muted-foreground"
            >
              <Heart className={`h-4 w-4 ${p.meGusta ? "fill-secondary text-secondary" : ""}`} strokeWidth={1.75} />
              {p.likes > 0 ? p.likes : "Me gusta"}
            </button>
          </div>
        ))
      )}
    </div>
  );
}
