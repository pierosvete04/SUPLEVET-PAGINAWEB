"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RichTextEditor } from "@/components/admin/blog/RichTextEditor";
import type { BlogPost } from "@/lib/data/blog-shared";

interface ProductoOpcion {
  slug: string;
  nombre: string;
}

interface PostEditorProps {
  post: BlogPost | null;
}

function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function PostEditor({ post }: PostEditorProps) {
  const router = useRouter();
  const [productos, setProductos] = useState<ProductoOpcion[]>([]);
  const [titulo, setTitulo] = useState(post?.titulo ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTocado, setSlugTocado] = useState(!!post);
  const [fechaPublicacion, setFechaPublicacion] = useState(
    post?.fecha_publicacion?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  );
  const [imagenDestacada, setImagenDestacada] = useState(post?.imagen_destacada ?? "");
  const [contenidoHtml, setContenidoHtml] = useState(post?.contenido_html ?? "");
  const [resumen, setResumen] = useState(post?.resumen ?? "");
  const [autor, setAutor] = useState(post?.autor ?? "Equipo Suplevet");
  const [productoSlug, setProductoSlug] = useState(post?.producto_slug ?? "");
  const [metaTitle, setMetaTitle] = useState(post?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.meta_description ?? "");
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .from("productos_web")
      .select("slug, nombre")
      .order("orden", { ascending: true })
      .then(({ data }) => setProductos((data as ProductoOpcion[]) ?? []));
  }, []);

  function handleTituloChange(valor: string) {
    setTitulo(valor);
    if (!slugTocado) setSlug(slugify(valor));
  }

  async function subirImagenDestacada(file: File) {
    setSubiendo(true);
    const supabase = createClient();
    const path = `${slug || "sin-slug"}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("blog-fotos").upload(path, file);
    if (!uploadError) {
      const { data } = supabase.storage.from("blog-fotos").getPublicUrl(path);
      setImagenDestacada(data.publicUrl);
    }
    setSubiendo(false);
  }

  async function guardar(estado: "borrador" | "publicado") {
    if (!titulo || !slug) {
      setError("Título y slug son obligatorios.");
      return;
    }
    setGuardando(true);
    setError(null);

    const payload = {
      titulo,
      slug,
      fecha_publicacion: fechaPublicacion,
      imagen_destacada: imagenDestacada || null,
      contenido_html: contenidoHtml,
      resumen: resumen || null,
      autor: autor || null,
      producto_slug: productoSlug || null,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      estado,
    };

    const supabase = createClient();
    const { error: saveError } = post
      ? await supabase.from("blog_posts").update(payload).eq("id", post.id)
      : await supabase.from("blog_posts").insert(payload);

    if (saveError) {
      setError(saveError.message);
      setGuardando(false);
      return;
    }
    router.push("/admin/blog");
    router.refresh();
  }

  return (
    <div>
      <Link
        href="/admin/blog"
        className="mb-6 flex w-fit items-center gap-1 font-body text-sm font-bold text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al blog
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div>
            <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
              Título
            </label>
            <input
              value={titulo}
              onChange={(e) => handleTituloChange(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 font-body text-lg font-bold text-secondary"
            />
          </div>

          <div>
            <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
              Slug (URL)
            </label>
            <input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTocado(true);
              }}
              className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm text-secondary"
            />
          </div>

          <div>
            <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
              Resumen corto
            </label>
            <textarea
              rows={2}
              value={resumen}
              onChange={(e) => setResumen(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm text-secondary"
            />
          </div>

          <div>
            <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
              Contenido
            </label>
            <RichTextEditor value={contenidoHtml} onChange={setContenidoHtml} />
          </div>

          <div className="rounded-xl border border-border bg-white p-4">
            <h2 className="mb-3 font-body text-sm font-bold uppercase text-muted-foreground">SEO</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block font-body text-xs font-bold text-muted-foreground">
                  Meta título
                </label>
                <input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm text-secondary"
                />
              </div>
              <div>
                <label className="mb-1 block font-body text-xs font-bold text-muted-foreground">
                  Meta descripción
                </label>
                <textarea
                  rows={2}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm text-secondary"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-white p-4">
            <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
              Fecha de publicación
            </label>
            <input
              type="date"
              value={fechaPublicacion}
              onChange={(e) => setFechaPublicacion(e.target.value)}
              className="mb-3 w-full rounded-lg border border-border px-3 py-2 font-body text-sm text-secondary"
            />

            <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
              Autor
            </label>
            <input
              value={autor}
              onChange={(e) => setAutor(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm text-secondary"
            />
          </div>

          <div className="rounded-xl border border-border bg-white p-4">
            <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
              Producto relacionado
            </label>
            <select
              value={productoSlug}
              onChange={(e) => setProductoSlug(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm text-secondary"
            >
              <option value="">Ninguno</option>
              {productos.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-border bg-white p-4">
            <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
              Imagen destacada
            </label>
            <input
              type="file"
              accept="image/*"
              disabled={subiendo}
              onChange={(e) => e.target.files?.[0] && subirImagenDestacada(e.target.files[0])}
              className="w-full font-body text-sm"
            />
            {imagenDestacada && (
              <div className="relative mt-3 h-32 w-full overflow-hidden rounded-lg">
                <Image src={imagenDestacada} alt="" fill className="object-cover" sizes="300px" />
              </div>
            )}
          </div>

          {error && <p className="font-body text-sm text-red-600">{error}</p>}

          <div className="flex flex-col gap-2">
            <button
              onClick={() => guardar("publicado")}
              disabled={guardando || subiendo}
              className="rounded-full bg-primary px-6 py-2.5 font-body font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {guardando ? "Guardando…" : "Publicar"}
            </button>
            <button
              onClick={() => guardar("borrador")}
              disabled={guardando || subiendo}
              className="rounded-full border border-border px-6 py-2.5 font-body font-bold text-secondary hover:bg-soft-gray disabled:opacity-50"
            >
              Guardar borrador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
