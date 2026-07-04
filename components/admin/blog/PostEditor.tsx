"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RichTextEditor } from "@/components/admin/blog/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { BlogPost } from "@/lib/data/blog-shared";

interface ProductoOpcion {
  slug: string;
  nombre: string;
}

interface PostEditorProps {
  post: BlogPost | null;
}

const SIN_PRODUCTO = "ninguno";

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
    <div className="flex flex-col gap-6">
      <Link href="/admin/blog" className="flex w-fit items-center gap-1 text-sm font-medium text-primary">
        <ArrowLeft className="h-4 w-4" /> Volver al blog
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="grid gap-1.5">
            <Label htmlFor="b-titulo">Título</Label>
            <Input
              id="b-titulo"
              value={titulo}
              onChange={(e) => handleTituloChange(e.target.value)}
              className="text-lg font-semibold"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="b-slug">Slug (URL)</Label>
            <Input
              id="b-slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTocado(true);
              }}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="b-resumen">Resumen corto</Label>
            <Textarea id="b-resumen" rows={2} value={resumen} onChange={(e) => setResumen(e.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label>Contenido</Label>
            <RichTextEditor value={contenidoHtml} onChange={setContenidoHtml} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">SEO</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="b-meta-title">Meta título</Label>
                <Input id="b-meta-title" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="b-meta-desc">Meta descripción</Label>
                <Textarea
                  id="b-meta-desc"
                  rows={2}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="grid gap-1.5">
                <Label htmlFor="b-fecha">Fecha de publicación</Label>
                <Input
                  id="b-fecha"
                  type="date"
                  value={fechaPublicacion}
                  onChange={(e) => setFechaPublicacion(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="b-autor">Autor</Label>
                <Input id="b-autor" value={autor} onChange={(e) => setAutor(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-1.5">
                <Label>Producto relacionado</Label>
                <Select
                  value={productoSlug || SIN_PRODUCTO}
                  onValueChange={(v) => setProductoSlug(v === SIN_PRODUCTO ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SIN_PRODUCTO}>Ninguno</SelectItem>
                    {productos.map((p) => (
                      <SelectItem key={p.slug} value={p.slug}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-2 pt-6">
              <Label htmlFor="b-imagen">Imagen destacada</Label>
              <Input
                id="b-imagen"
                type="file"
                accept="image/*"
                disabled={subiendo}
                onChange={(e) => e.target.files?.[0] && subirImagenDestacada(e.target.files[0])}
              />
              {imagenDestacada && (
                <div className="relative h-32 w-full overflow-hidden rounded-lg">
                  <Image src={imagenDestacada} alt="" fill className="object-cover" sizes="300px" />
                </div>
              )}
            </CardContent>
          </Card>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col gap-2">
            <Button onClick={() => guardar("publicado")} disabled={guardando || subiendo}>
              {guardando ? "Guardando…" : "Publicar"}
            </Button>
            <Button
              variant="outline"
              onClick={() => guardar("borrador")}
              disabled={guardando || subiendo}
            >
              Guardar borrador
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
