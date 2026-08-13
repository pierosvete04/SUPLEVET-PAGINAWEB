"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { revalidarSitioPublico } from "@/lib/revalidar-publico";
import { traducirErrorSupabase } from "@/lib/errores-supabase";
import { createClient } from "@/lib/supabase/client";
import { uploadFileToR2 } from "@/lib/uploadToR2";
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
import type { BlogFaq, BlogPost } from "@/lib/data/blog-shared";

const FAQ_VACIA: BlogFaq = { pregunta: "", respuesta: "" };

interface ProductoOpcion {
  slug: string;
  nombre: string;
}

interface PostEditorProps {
  post: BlogPost | null;
}

const SIN_PRODUCTO = "ninguno";
const META_TITLE_SUGERIDO = 60;
const META_DESC_SUGERIDO = 155;

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
  const [faqs, setFaqs] = useState<BlogFaq[]>(post?.faqs?.length ? post.faqs : []);
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
    const url = await uploadFileToR2("blog-fotos", file, slug || "sin-slug");
    if (url) setImagenDestacada(url);
    setSubiendo(false);
  }

  function agregarFaq() {
    setFaqs((f) => [...f, { ...FAQ_VACIA }]);
  }

  function actualizarFaq(indice: number, campo: keyof BlogFaq, valor: string) {
    setFaqs((f) => f.map((item, i) => (i === indice ? { ...item, [campo]: valor } : item)));
  }

  function quitarFaq(indice: number) {
    setFaqs((f) => f.filter((_, i) => i !== indice));
  }

  async function guardar(estado: "borrador" | "publicado") {
    if (!titulo || !slug) {
      setError("Título y slug son obligatorios.");
      return;
    }
    setGuardando(true);
    setError(null);

    // Solo se guardan las preguntas con ambos campos completos — una FAQ a
    // medio llenar no debe llegar al FAQPage JSON-LD de la página pública.
    const faqsValidas = faqs.filter((f) => f.pregunta.trim() && f.respuesta.trim());

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
      faqs: faqsValidas,
      estado,
    };

    const supabase = createClient();
    const { error: saveError } = post
      ? await supabase.from("blog_posts").update(payload).eq("id", post.id)
      : await supabase.from("blog_posts").insert(payload);

    if (saveError) {
      setError(traducirErrorSupabase(saveError));
      setGuardando(false);
      return;
    }
    await revalidarSitioPublico();
    toast.success(estado === "publicado" ? "Post publicado." : "Borrador guardado.");
    router.push("/admin/blog");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/blog" className="flex w-fit items-center gap-1 text-sm font-medium text-secondary">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="b-meta-title">Meta título</Label>
                  <span
                    className={`text-xs ${
                      metaTitle.length > META_TITLE_SUGERIDO ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {metaTitle.length}/{META_TITLE_SUGERIDO}
                  </span>
                </div>
                <Input
                  id="b-meta-title"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={titulo || "Si lo dejas vacío, se usa el título del artículo"}
                />
              </div>
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="b-meta-desc">Meta descripción</Label>
                  <span
                    className={`text-xs ${
                      metaDescription.length > META_DESC_SUGERIDO
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {metaDescription.length}/{META_DESC_SUGERIDO}
                  </span>
                </div>
                <Textarea
                  id="b-meta-desc"
                  rows={2}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Si lo dejas vacío, se usa el resumen del artículo"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Google suele cortar el título cerca de {META_TITLE_SUGERIDO} caracteres y la
                descripción cerca de {META_DESC_SUGERIDO} — pasarte de largo no rompe nada, pero se
                verá truncado en los resultados de búsqueda.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                Preguntas frecuentes del artículo
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground">
                Se muestran como acordeón al final del artículo y además se envían a Google como
                datos estructurados (FAQPage) — el formato que Google AI Overviews, Gemini y otros
                asistentes prefieren citar cuando alguien busca una pregunta puntual.
              </p>
              {faqs.map((faq, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs">Pregunta {i + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => quitarFaq(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={faq.pregunta}
                    placeholder="¿Suplevet contiene lactoferrina?"
                    onChange={(e) => actualizarFaq(i, "pregunta", e.target.value)}
                  />
                  <Textarea
                    rows={3}
                    value={faq.respuesta}
                    placeholder="Sí, Suplevet está formulado con lactoferrina y..."
                    onChange={(e) => actualizarFaq(i, "respuesta", e.target.value)}
                  />
                </div>
              ))}
              <Button type="button" variant="outline" onClick={agregarFaq} className="gap-1.5">
                <Plus className="h-4 w-4" /> Agregar pregunta
              </Button>
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
