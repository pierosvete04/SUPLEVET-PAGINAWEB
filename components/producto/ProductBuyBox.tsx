"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Gift, Truck, Check, Play } from "lucide-react";
import { formatPrecio, type ProductoCombo } from "@/lib/data/productos-shared";
import { useCart } from "@/lib/cart/CartContext";
import { trackEvent } from "@/lib/analytics";
import type { Regalo } from "@/lib/regalos";
import type { ResenaProducto } from "@/lib/resenas";
import { ProductRatingSummary } from "@/components/producto/ProductRatingSummary";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ProductBuyBoxProps {
  producto: ProductoCombo;
  regalos: Regalo[];
  resenas: ResenaProducto[];
}

export function ProductBuyBox({ producto, regalos, resenas }: ProductBuyBoxProps) {
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);
  const [videoAbierto, setVideoAbierto] = useState<string | null>(null);
  const { addItem } = useCart();
  const router = useRouter();

  function handleAgregar() {
    addItem(
      { slug: producto.slug, nombre: producto.nombre, precio: producto.precio, imagen: producto.imagen },
      cantidad
    );
    trackEvent("add_to_cart", {
      item_slug: producto.slug,
      item_name: producto.nombre,
      value: producto.precio * cantidad,
      quantity: cantidad,
    });
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1500);
  }

  function handleComprarAhora() {
    addItem(
      { slug: producto.slug, nombre: producto.nombre, precio: producto.precio, imagen: producto.imagen },
      cantidad
    );
    trackEvent("begin_checkout", {
      item_slug: producto.slug,
      item_name: producto.nombre,
      value: producto.precio * cantidad,
      quantity: cantidad,
    });
    router.push("/carrito");
  }

  return (
    <div>
      <p className="font-impact text-sky text-sm tracking-wide">SUPLEMENTO NUTRICIONAL</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-secondary md:text-4xl">
        {producto.nombre}
      </h1>
      <ProductRatingSummary resenas={resenas} />
      <p className="mt-2 font-body text-muted-foreground">{producto.descripcion}</p>

      <div className="mt-4 flex items-baseline gap-3">
        <span className="font-body text-3xl font-bold text-primary">
          {formatPrecio(producto.precio)}
        </span>
        {producto.precioComparacion > producto.precio && (
          <span className="font-body text-lg text-muted-foreground line-through">
            {formatPrecio(producto.precioComparacion)}
          </span>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <span className="font-body text-sm font-bold text-secondary">Cantidad</span>
        <div className="flex items-center rounded-full border border-border">
          <button
            type="button"
            aria-label="Restar cantidad"
            onClick={() => setCantidad((c) => Math.max(1, c - 1))}
            className="flex h-9 w-9 items-center justify-center text-secondary"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-6 text-center font-body font-bold">{cantidad}</span>
          <button
            type="button"
            aria-label="Sumar cantidad"
            onClick={() => setCantidad((c) => c + 1)}
            className="flex h-9 w-9 items-center justify-center text-secondary"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleAgregar}
          className={`flex items-center justify-center gap-2 rounded-full px-6 py-3 font-body font-bold transition-colors ${
            agregado
              ? "bg-green-500 text-white"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {agregado ? (
            <>
              <Check className="h-5 w-5" strokeWidth={2} /> Añadido
            </>
          ) : (
            "Añadir al carrito"
          )}
        </button>
        <button
          type="button"
          onClick={handleComprarAhora}
          className="rounded-full border-2 border-secondary px-6 py-3 font-body font-bold text-secondary transition-colors hover:bg-secondary hover:text-white"
        >
          Comprar ahora
        </button>
      </div>

      {/* Mini videos justo debajo de "Comprar ahora" — clic para verlos en
          grande. Contenido real gestionado por producto desde /admin/productos. */}
      {producto.videos.length > 0 && (
        <div className="mt-5">
          <p className="font-body text-xs font-bold uppercase tracking-wide text-secondary">
            Mira a Suplevet en acción
          </p>
          <div className="mt-2 flex gap-2">
            {producto.videos.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setVideoAbierto(url)}
                aria-label={`Ver video ${i + 1}`}
                className="relative flex aspect-[9/16] w-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-card)] bg-soft-gray text-white transition-opacity hover:opacity-90"
              >
                <video src={`${url}#t=0.5`} className="absolute inset-0 h-full w-full object-cover" muted preload="metadata" />
                <Play className="relative h-5 w-5 drop-shadow" strokeWidth={1.5} fill="white" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center gap-2 font-body text-sm text-muted-foreground">
        <Truck className="h-4 w-4 text-accent" strokeWidth={1.75} />
        Envío gratis en Lima Metropolitana desde S/.150
      </div>

      {/* Banner de regalo — solo se muestra si hay un regalo activo y vigente
          configurado desde /admin/regalos (PLAN.md sección 5.4.1). Sin
          regalos activos, este bloque no aparece. */}
      {regalos.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {regalos.map((regalo) => (
            <div
              key={regalo.id}
              className="flex items-start gap-3 rounded-[var(--radius-card)] border-2 border-dashed border-accent bg-accent/10 p-4"
            >
              <Gift className="h-6 w-6 shrink-0 text-secondary" strokeWidth={1.75} />
              <div>
                <p className="font-body text-sm font-bold text-secondary">
                  {regalo.condicion_tipo === "monto_minimo"
                    ? `Regalo gratis en compras desde ${formatPrecio(regalo.condicion_monto_minimo ?? 0)}`
                    : `Regalo gratis con ${producto.nombre}`}
                </p>
                {regalo.descripcion && (
                  <p className="font-body text-xs text-muted-foreground">{regalo.descripcion}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={videoAbierto !== null} onOpenChange={(open) => !open && setVideoAbierto(null)}>
        <DialogContent className="max-w-sm bg-black p-0">
          <DialogTitle className="sr-only">Video de Suplevet</DialogTitle>
          {videoAbierto && (
            <video
              src={videoAbierto}
              className="aspect-[9/16] w-full"
              controls
              autoPlay
              playsInline
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
