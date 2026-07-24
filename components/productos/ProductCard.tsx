"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { formatPrecio, type ProductoCombo } from "@/lib/data/productos-shared";
import { useCart } from "@/lib/cart/CartContext";

interface ProductCardProps {
  producto: ProductoCombo;
  /** Texto del botón de acción — "Añadir al carrito" en el catálogo, "Comprar
   * ahora" en secciones de la home donde se busca una llamada más directa. */
  ctaLabel?: string;
}

export function ProductCard({ producto, ctaLabel = "Añadir al carrito" }: ProductCardProps) {
  const { addItem } = useCart();
  const [agregado, setAgregado] = useState(false);

  function handleAgregar() {
    addItem({
      slug: producto.slug,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen,
      categoria: producto.categoria,
      metodosPagoPermitidos: producto.metodosPagoPermitidos,
    });
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1500);
  }

  return (
    <div className="relative flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[0_8px_30px_rgba(37,60,97,0.08)]">
      {/* Link "estirado" — cubre toda la tarjeta para que cualquier click fuera
          del botón de carrito navegue al producto. El contenido va con
          pointer-events-none y solo el botón recupera pointer-events-auto. */}
      <Link
        href={`/productos/${producto.slug}`}
        aria-label={`Ver ${producto.nombre}`}
        className="absolute inset-0 z-0"
      />

      <div className="pointer-events-none relative aspect-square bg-soft-gray">
        {producto.descuentoPorcentaje > 0 && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-primary px-3 py-1 font-body text-xs font-bold text-primary-foreground">
            -{producto.descuentoPorcentaje}%
          </span>
        )}
        <Image
          src={producto.imagen}
          alt={producto.nombre}
          fill
          className="object-cover"
          sizes="(min-width: 768px) 33vw, 100vw"
        />
      </div>
      <div className="pointer-events-none flex flex-1 flex-col gap-2 p-3.5">
        <h3 className="font-display text-xl font-bold text-secondary">{producto.nombre}</h3>
        <p className="line-clamp-2 font-body text-sm text-muted-foreground">{producto.descripcion}</p>
        <div className="mt-auto flex flex-col gap-2 pt-1">
          <div className="flex items-baseline gap-2">
            <span className="font-body text-lg font-bold text-secondary">
              {formatPrecio(producto.precio)}
            </span>
            {producto.precioComparacion > producto.precio && (
              <span className="font-body text-xs text-muted-foreground line-through">
                {formatPrecio(producto.precioComparacion)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleAgregar}
            aria-label={`Añadir ${producto.nombre} al carrito`}
            className={`pointer-events-auto relative z-10 flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-[17px] py-3 font-body text-xs font-bold transition-opacity sm:gap-2 sm:text-sm md:text-base ${
              agregado
                ? "bg-green-500 text-white"
                : "bg-gradient-to-br from-accent to-portal-teal-mid text-secondary hover:opacity-90"
            }`}
          >
            {agregado ? (
              <>
                <Check className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" strokeWidth={2} /> Añadido
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" strokeWidth={1.75} />
                <span className="sm:hidden">Añadir</span>
                <span className="hidden sm:inline">{ctaLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
