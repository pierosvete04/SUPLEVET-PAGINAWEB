"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { revalidarSitioPublico } from "@/lib/revalidar-publico";
import { traducirErrorSupabase } from "@/lib/errores-supabase";
import {
  AlertCircle,
  Boxes,
  Eye,
  EyeOff,
  Film,
  ImageIcon,
  Info,
  Search,
  Tag,
  Wallet,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadFileToR2 } from "@/lib/uploadToR2";
import { TODOS_LOS_METODOS_PAGO, type MetodoPago } from "@/lib/data/productos-shared";
import { LARGO_META, resolverSeoProducto } from "@/lib/seo-producto";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ContadorCaracteres } from "./ContadorCaracteres";
import { GestorImagenes } from "./GestorImagenes";
import { VistaPreviaGoogle } from "./VistaPreviaGoogle";
import { SelectorMetodosPago } from "./SelectorMetodosPago";
import { VistaPreviaProducto, type RequisitoPublicacion } from "./VistaPreviaProducto";

export interface ProductoWeb {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  categoria: "producto" | "combo";
  precio: number;
  precio_comparacion: number;
  imagen: string;
  galeria: string[];
  descuento_porcentaje: number;
  sku: string | null;
  stock: number | null;
  activo: boolean;
  orden: number;
  videos: string[];
  shopify_product_id: string | null;
  metodos_pago_permitidos: MetodoPago[];
  meta_titulo: string;
  meta_descripcion: string;
  descripcion_larga: string;
  gtin: string | null;
  og_imagen: string;
  indexable: boolean;
}

interface ProductoFormProps {
  producto: ProductoWeb | null;
  onClose: () => void;
  onSaved: () => void;
}

const VACIO: Omit<ProductoWeb, "id"> = {
  slug: "",
  nombre: "",
  descripcion: "",
  categoria: "producto",
  precio: 0,
  precio_comparacion: 0,
  imagen: "",
  galeria: [],
  descuento_porcentaje: 0,
  sku: "",
  stock: null,
  activo: true,
  orden: 0,
  videos: [],
  shopify_product_id: "",
  metodos_pago_permitidos: [...TODOS_LOS_METODOS_PAGO],
  meta_titulo: "",
  meta_descripcion: "",
  descripcion_larga: "",
  gtin: "",
  og_imagen: "",
  indexable: true,
};

function aSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** El badge "-X%" del catálogo lee esta columna; antes quedaba siempre en 0
 *  porque el formulario no la editaba. Ahora se deriva de los dos precios. */
function calcularDescuento(precio: number, comparacion: number): number {
  if (!comparacion || comparacion <= precio) return 0;
  return Math.round(((comparacion - precio) / comparacion) * 100);
}

export function ProductoForm({ producto, onClose, onSaved }: ProductoFormProps) {
  const [form, setForm] = useState<Omit<ProductoWeb, "id">>(producto ?? VACIO);
  const [subiendoFotos, setSubiendoFotos] = useState(false);
  const [subiendoVideos, setSubiendoVideos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // El slug se autogenera desde el nombre solo mientras el admin no lo haya
  // escrito a mano y solo en productos nuevos (cambiarlo después rompe la URL
  // pública y los enlaces ya compartidos).
  const slugManual = useRef(Boolean(producto));

  const descuento = calcularDescuento(form.precio, form.precio_comparacion);
  const subiendo = subiendoFotos || subiendoVideos;

  // Mismo resolvedor que usa la ficha pública: así la vista previa de Google
  // no inventa su propia cadena de respaldos y luego muestra algo distinto.
  const seo = resolverSeoProducto({
    nombre: form.nombre,
    descripcion: form.descripcion,
    imagen: form.imagen,
    metaTitulo: form.meta_titulo,
    metaDescripcion: form.meta_descripcion,
    descripcionLarga: form.descripcion_larga,
    ogImagen: form.og_imagen,
    indexable: form.indexable,
  });

  const requisitos = useMemo<RequisitoPublicacion[]>(
    () => [
      { ok: form.nombre.trim().length > 0, texto: "Ponle un nombre" },
      { ok: form.slug.trim().length > 0, texto: "Define la dirección (URL)" },
      { ok: form.imagen.length > 0, texto: "Elige una foto de portada" },
      { ok: form.precio > 0, texto: "Escribe el precio de venta" },
      { ok: form.descripcion.trim().length > 0, texto: "Agrega una descripción" },
      { ok: form.metodos_pago_permitidos.length > 0, texto: "Marca al menos un método de pago" },
    ],
    [form]
  );

  function actualizarNombre(nombre: string) {
    setForm((f) => ({ ...f, nombre, slug: slugManual.current ? f.slug : aSlug(nombre) }));
  }

  async function subirVideos(files: FileList) {
    setSubiendoVideos(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadFileToR2("productos-web-videos", file, form.slug || "sin-slug");
      if (url) urls.push(url);
    }
    setForm((f) => ({ ...f, videos: [...f.videos, ...urls] }));
    setSubiendoVideos(false);
    if (urls.length < files.length) toast.error("Algún video no se pudo subir. Inténtalo de nuevo.");
  }

  async function subirFotos(files: FileList) {
    setSubiendoFotos(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadFileToR2("productos-web-fotos", file, form.slug || "sin-slug");
      if (url) urls.push(url);
    }
    setForm((f) => ({
      ...f,
      galeria: [...f.galeria, ...urls],
      imagen: f.imagen || urls[0] || "",
    }));
    setSubiendoFotos(false);
    if (urls.length < files.length) toast.error("Alguna foto no se pudo subir. Inténtalo de nuevo.");
  }

  async function subirOgImagen(file: File) {
    setSubiendoFotos(true);
    const url = await uploadFileToR2("productos-web-fotos", file, form.slug || "sin-slug");
    setSubiendoFotos(false);
    if (!url) {
      toast.error("La imagen no se pudo subir. Inténtalo de nuevo.");
      return;
    }
    setForm((f) => ({ ...f, og_imagen: url }));
  }

  function toggleMetodoPago(id: MetodoPago) {
    setForm((f) => ({
      ...f,
      metodos_pago_permitidos: f.metodos_pago_permitidos.includes(id)
        ? f.metodos_pago_permitidos.filter((m) => m !== id)
        : [...f.metodos_pago_permitidos, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const faltantes = requisitos.filter((r) => !r.ok);
    if (faltantes.length > 0) {
      setError(`Falta completar: ${faltantes.map((r) => r.texto.toLowerCase()).join(", ")}.`);
      return;
    }
    setGuardando(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      ...form,
      slug: aSlug(form.slug),
      stock: form.stock === null ? null : Number(form.stock),
      descuento_porcentaje: descuento,
    };

    const { error: saveError } = producto
      ? await supabase.from("productos_web").update(payload).eq("id", producto.id)
      : await supabase.from("productos_web").insert(payload);

    if (saveError) {
      setError(traducirErrorSupabase(saveError));
      setGuardando(false);
      return;
    }
    await revalidarSitioPublico();
    toast.success(producto ? "Producto actualizado." : "Producto creado.");
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{producto ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Todo lo que cambies acá se ve en la tienda apenas guardes.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[1fr_280px]">
            <div className="flex min-w-0 flex-col gap-7">
              <Seccion icono={Tag} titulo="Lo básico" ayuda="Cómo se llama y dónde vive en la web.">
                <Campo etiqueta="Nombre del producto" htmlFor="p-nombre">
                  <Input
                    id="p-nombre"
                    value={form.nombre}
                    placeholder="Ej. Suplevet 150g"
                    onChange={(e) => actualizarNombre(e.target.value)}
                  />
                </Campo>

                <Campo
                  etiqueta="Dirección en la web (URL)"
                  htmlFor="p-slug"
                  ayuda={
                    producto
                      ? "Cambiarla rompe los enlaces que ya compartiste. Cámbiala solo si sabes lo que haces."
                      : "Se llena sola con el nombre. Solo minúsculas, números y guiones."
                  }
                >
                  <div className="flex items-center rounded-md border border-input bg-muted/50 pl-3 focus-within:ring-2 focus-within:ring-ring">
                    <span className="shrink-0 text-sm text-muted-foreground">
                      suplevet.pe/productos/
                    </span>
                    <Input
                      id="p-slug"
                      value={form.slug}
                      className="border-0 bg-transparent px-1 focus-visible:ring-0"
                      onChange={(e) => {
                        slugManual.current = true;
                        setForm((f) => ({ ...f, slug: e.target.value }));
                      }}
                    />
                  </div>
                </Campo>

                <Campo
                  etiqueta="Descripción"
                  htmlFor="p-descripcion"
                  ayuda="Una o dos frases. Aparece debajo del nombre en la ficha del producto."
                >
                  <Textarea
                    id="p-descripcion"
                    rows={3}
                    value={form.descripcion}
                    placeholder="Suplemento hiperproteico para uso veterinario."
                    onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  />
                </Campo>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo etiqueta="Tipo" ayuda="Los combos se muestran en su propia sección.">
                    <div className="grid grid-cols-2 gap-2">
                      {(["producto", "combo"] as const).map((valor) => (
                        <button
                          key={valor}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, categoria: valor }))}
                          className={cn(
                            "rounded-md border-2 px-3 py-2 text-sm font-medium capitalize transition-colors",
                            form.categoria === valor
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/40"
                          )}
                        >
                          {valor}
                        </button>
                      ))}
                    </div>
                  </Campo>
                  <Campo
                    etiqueta="SKU"
                    htmlFor="p-sku"
                    ayuda="Tu código interno de inventario. Opcional."
                  >
                    <Input
                      id="p-sku"
                      value={form.sku ?? ""}
                      placeholder="SV-150"
                      onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    />
                  </Campo>
                </div>
              </Seccion>

              <Seccion
                icono={Boxes}
                titulo="Precio y stock"
                ayuda="El precio tachado y el porcentaje de oferta salen de acá."
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <Campo etiqueta="Precio de venta" htmlFor="p-precio">
                    <div className="flex items-center rounded-md border border-input pl-3 focus-within:ring-2 focus-within:ring-ring">
                      <span className="text-sm text-muted-foreground">S/</span>
                      <Input
                        id="p-precio"
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        value={form.precio || ""}
                        className="border-0 bg-transparent px-1 tabular-nums focus-visible:ring-0"
                        onChange={(e) => setForm((f) => ({ ...f, precio: Number(e.target.value) }))}
                      />
                    </div>
                  </Campo>
                  <Campo etiqueta="Precio antes (tachado)" htmlFor="p-precio-comp">
                    <div className="flex items-center rounded-md border border-input pl-3 focus-within:ring-2 focus-within:ring-ring">
                      <span className="text-sm text-muted-foreground">S/</span>
                      <Input
                        id="p-precio-comp"
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        value={form.precio_comparacion || ""}
                        className="border-0 bg-transparent px-1 tabular-nums focus-visible:ring-0"
                        onChange={(e) =>
                          setForm((f) => ({ ...f, precio_comparacion: Number(e.target.value) }))
                        }
                      />
                    </div>
                  </Campo>
                  <Campo
                    etiqueta="Stock"
                    htmlFor="p-stock"
                    ayuda="Déjalo vacío si no llevas control."
                  >
                    <Input
                      id="p-stock"
                      type="number"
                      min="0"
                      inputMode="numeric"
                      placeholder="Sin límite"
                      className="tabular-nums"
                      value={form.stock ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          stock: e.target.value === "" ? null : Number(e.target.value),
                        }))
                      }
                    />
                  </Campo>
                </div>
                <p className="text-xs text-muted-foreground">
                  {descuento > 0 ? (
                    <>
                      En la tienda aparecerá el sello{" "}
                      <strong className="font-semibold text-destructive">-{descuento}%</strong> y el
                      precio antiguo tachado.
                    </>
                  ) : (
                    "Sin sello de oferta. Para mostrarlo, pon un precio antes mayor al de venta."
                  )}
                </p>
              </Seccion>

              <Seccion
                icono={ImageIcon}
                titulo="Fotos"
                ayuda="La primera impresión del producto. Elige tú cuál es la portada."
              >
                <GestorImagenes
                  galeria={form.galeria}
                  principal={form.imagen}
                  subiendo={subiendoFotos}
                  onSubir={subirFotos}
                  onCambiar={(galeria, imagen) => setForm((f) => ({ ...f, galeria, imagen }))}
                />
              </Seccion>

              <Seccion
                icono={Film}
                titulo="Videos"
                ayuda='Se muestran en la sección "Mira a Suplevet en acción" de la ficha.'
              >
                <div className="flex flex-wrap items-center gap-2">
                  {form.videos.map((url) => (
                    <div
                      key={url}
                      className="relative h-20 w-20 overflow-hidden rounded-md border bg-black"
                    >
                      <video src={url} className="h-full w-full object-cover" muted playsInline />
                      <button
                        type="button"
                        aria-label="Quitar video"
                        onClick={() =>
                          setForm((f) => ({ ...f, videos: f.videos.filter((v) => v !== url) }))
                        }
                        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-md bg-white/90 text-foreground hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <label
                    className={cn(
                      "grid h-20 w-20 cursor-pointer place-items-center rounded-md border-2 border-dashed border-border text-center text-xs text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5",
                      subiendoVideos && "pointer-events-none opacity-60"
                    )}
                  >
                    {subiendoVideos ? "Subiendo…" : "+ Video"}
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      className="sr-only"
                      disabled={subiendoVideos}
                      onChange={(e) => {
                        if (e.target.files?.length) subirVideos(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </Seccion>

              <Seccion
                icono={Wallet}
                titulo="Cómo puede pagar el cliente"
                ayuda="Solo los métodos marcados aparecen en el checkout de este producto."
              >
                <SelectorMetodosPago
                  seleccionados={form.metodos_pago_permitidos}
                  onToggle={toggleMetodoPago}
                />
              </Seccion>

              <Seccion
                icono={Search}
                titulo="Cómo aparece en Google"
                ayuda="Si dejas un campo vacío se usa el nombre o la descripción de arriba. Llenarlos te da control sobre lo que ve alguien que todavía no conoce la marca."
              >
                <VistaPreviaGoogle
                  titulo={seo.titulo}
                  descripcion={seo.descripcion}
                  slug={form.slug}
                />

                <Campo etiqueta="Título en Google" htmlFor="p-meta-titulo">
                  <Input
                    id="p-meta-titulo"
                    value={form.meta_titulo}
                    placeholder={`${form.nombre || "Nombre"} — Suplevet`}
                    onChange={(e) => setForm((f) => ({ ...f, meta_titulo: e.target.value }))}
                  />
                  <ContadorCaracteres
                    texto={form.meta_titulo}
                    min={30}
                    max={LARGO_META.tituloMax}
                    respaldo={`${form.nombre} — Suplevet`}
                  />
                </Campo>

                <Campo etiqueta="Descripción en Google" htmlFor="p-meta-descripcion">
                  <Textarea
                    id="p-meta-descripcion"
                    rows={3}
                    value={form.meta_descripcion}
                    placeholder="Suplemento hiperproteico para perros y gatos. Refuerza defensas, digestión y vitalidad. Envío a todo Lima en 24 h."
                    onChange={(e) => setForm((f) => ({ ...f, meta_descripcion: e.target.value }))}
                  />
                  <ContadorCaracteres
                    texto={form.meta_descripcion}
                    min={LARGO_META.descripcionMin}
                    max={LARGO_META.descripcionMax}
                    respaldo={form.descripcion}
                  />
                </Campo>

                <Campo
                  etiqueta="Descripción larga (anuncios de compras)"
                  htmlFor="p-descripcion-larga"
                  ayuda="La que va al catálogo de Google Shopping, Meta y TikTok. Ahí sí conviene extenderse: ingredientes, para qué sirve, presentación, para qué mascota."
                >
                  <Textarea
                    id="p-descripcion-larga"
                    rows={5}
                    value={form.descripcion_larga}
                    onChange={(e) => setForm((f) => ({ ...f, descripcion_larga: e.target.value }))}
                  />
                  <ContadorCaracteres
                    texto={form.descripcion_larga}
                    min={300}
                    max={5000}
                    respaldo={form.descripcion}
                  />
                </Campo>

                <Campo
                  etiqueta="Código de barras (GTIN/EAN)"
                  htmlFor="p-gtin"
                  ayuda="El número bajo el código de barras del envase. Sin él, Google Shopping marca el producto como “sin identificador” y lo muestra menos que a la competencia."
                >
                  <Input
                    id="p-gtin"
                    value={form.gtin ?? ""}
                    inputMode="numeric"
                    placeholder="7750000000000"
                    className="tabular-nums"
                    onChange={(e) => setForm((f) => ({ ...f, gtin: e.target.value }))}
                  />
                </Campo>

                <Campo
                  etiqueta="Imagen para WhatsApp y redes"
                  ayuda="Se ve al pegar el enlace del producto en un chat o publicación. Debe ser horizontal (1200 × 630); si la dejas vacía se usa la foto de portada, que es cuadrada y WhatsApp la recorta por los lados."
                >
                  <div className="flex items-center gap-3">
                    {form.og_imagen && (
                      <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-md border bg-soft-gray">
                        <Image
                          src={form.og_imagen}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                        <button
                          type="button"
                          aria-label="Quitar imagen para redes"
                          onClick={() => setForm((f) => ({ ...f, og_imagen: "" }))}
                          className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-md bg-white/90 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <label
                      className={cn(
                        "cursor-pointer rounded-md border-2 border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5",
                        subiendoFotos && "pointer-events-none opacity-60"
                      )}
                    >
                      {form.og_imagen ? "Cambiar imagen" : "Subir imagen horizontal"}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={subiendoFotos}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) subirOgImagen(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </Campo>

                <label className="flex items-start gap-2.5 rounded-md border p-3">
                  <Checkbox
                    checked={form.indexable}
                    className="mt-0.5"
                    onCheckedChange={(v) => setForm((f) => ({ ...f, indexable: v === true }))}
                  />
                  <span>
                    <span className="text-sm font-medium">Que aparezca en Google</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                      Desmárcalo solo para productos que deben existir en la tienda pero no competir
                      en buscadores (duplicados, combos de campaña). También lo saca del catálogo de
                      anuncios.
                    </span>
                  </span>
                </label>
              </Seccion>

              <details className="group rounded-md border bg-muted/30">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  Ajustes avanzados
                  <span className="ml-auto text-xs font-normal text-muted-foreground group-open:hidden">
                    Mostrar
                  </span>
                  <span className="ml-auto hidden text-xs font-normal text-muted-foreground group-open:inline">
                    Ocultar
                  </span>
                </summary>
                <div className="flex flex-col gap-4 border-t px-4 py-4">
                  <Campo
                    etiqueta="Código de reseñas importadas"
                    htmlFor="p-shopify-id"
                    ayuda="Es el ID que este producto tenía en la tienda anterior de Shopify. No sirve para vender: sirve para que las reseñas y las fotos de los pedidos antiguos (importados de Shopify) sigan apareciendo junto a este producto. Si lo borras, ese historial deja de mostrarse."
                  >
                    <Input
                      id="p-shopify-id"
                      value={form.shopify_product_id ?? ""}
                      placeholder="Vacío si el producto nunca estuvo en Shopify"
                      className="tabular-nums"
                      onChange={(e) =>
                        setForm((f) => ({ ...f, shopify_product_id: e.target.value }))
                      }
                    />
                  </Campo>
                  <Campo
                    etiqueta="Orden en el catálogo"
                    htmlFor="p-orden"
                    ayuda="Número menor = aparece primero."
                  >
                    <Input
                      id="p-orden"
                      type="number"
                      className="w-28 tabular-nums"
                      value={form.orden}
                      onChange={(e) => setForm((f) => ({ ...f, orden: Number(e.target.value) }))}
                    />
                  </Campo>
                </div>
              </details>
            </div>

            <VistaPreviaProducto
              nombre={form.nombre}
              slug={form.slug}
              imagen={form.imagen}
              precio={form.precio}
              precioComparacion={form.precio_comparacion}
              descuento={descuento}
              categoria={form.categoria}
              activo={form.activo}
              requisitos={requisitos}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t bg-card px-6 py-4">
            <button
              type="button"
              aria-pressed={form.activo}
              onClick={() => setForm((f) => ({ ...f, activo: !f.activo }))}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-colors",
                form.activo
                  ? "border-green-600/30 bg-green-50 text-green-700"
                  : "border-border bg-muted text-muted-foreground"
              )}
            >
              {form.activo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {form.activo ? "Visible en la tienda" : "Oculto en la tienda"}
            </button>

            {error && (
              <p className="flex items-start gap-1.5 text-sm text-destructive" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            <div className="ml-auto flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={guardando}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando || subiendo}>
                {guardando ? "Guardando…" : subiendo ? "Espera, subiendo…" : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface SeccionProps {
  icono: typeof Tag;
  titulo: string;
  ayuda: string;
  children: React.ReactNode;
}

function Seccion({ icono: Icono, titulo, ayuda, children }: SeccionProps) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-start gap-2.5 border-b pb-2">
        <Icono className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <h3 className="text-sm font-semibold leading-none">{titulo}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{ayuda}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

interface CampoProps {
  etiqueta: string;
  htmlFor?: string;
  ayuda?: string;
  children: React.ReactNode;
}

function Campo({ etiqueta, htmlFor, ayuda, children }: CampoProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{etiqueta}</Label>
      {children}
      {ayuda && <p className="text-xs leading-snug text-muted-foreground">{ayuda}</p>}
    </div>
  );
}
