"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { formatPrecio, type ProductoCombo } from "@/lib/data/productos-temp";
import { useCart } from "@/lib/cart/CartContext";

interface ProductCardProps {
  producto: ProductoCombo;
}

export function ProductCard({ producto }: ProductCardProps) {
  const { addItem } = useCart();
  const [agregado, setAgregado] = useState(false);

  function handleAgregar() {
    addItem({
      slug: producto.slug,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen,
    });
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1500);
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_8px_30px_rgba(37,60,97,0.08)]">
      <Link href={`/productos/${producto.slug}`} className="relative block aspect-square bg-soft-gray">
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
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Link href={`/productos/${producto.slug}`}>
          <h3 className="font-display text-lg font-bold text-secondary hover:text-primary">
            {producto.nombre}
          </h3>
        </Link>
        <p className="font-body text-sm text-muted-foreground">{producto.descripcion}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2">
            <span className="font-body text-xl font-bold text-primary">
              {formatPrecio(producto.precio)}
            </span>
            {producto.precioComparacion > producto.precio && (
              <span className="font-body text-sm text-muted-foreground line-through">
                {formatPrecio(producto.precioComparacion)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleAgregar}
            aria-label={`Agregar ${producto.nombre} al carrito`}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              agregado ? "bg-green-500 text-white" : "bg-accent text-secondary hover:opacity-90"
            }`}
          >
            {agregado ? (
              <Check className="h-5 w-5" strokeWidth={2} />
            ) : (
              <ShoppingCart className="h-5 w-5" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
