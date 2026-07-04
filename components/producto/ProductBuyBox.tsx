"use client";

import { useState } from "react";
import { Minus, Plus, Gift, Truck } from "lucide-react";
import { formatPrecio, type ProductoCombo } from "@/lib/data/productos-temp";

interface ProductBuyBoxProps {
  producto: ProductoCombo;
}

export function ProductBuyBox({ producto }: ProductBuyBoxProps) {
  const [cantidad, setCantidad] = useState(1);

  return (
    <div>
      <p className="font-impact text-sky text-sm tracking-wide">SUPLEMENTO NUTRICIONAL</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-secondary md:text-4xl">
        {producto.nombre}
      </h1>
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
          className="rounded-full bg-primary px-6 py-3 font-body font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Agregar al carrito
        </button>
        <button
          type="button"
          className="rounded-full border-2 border-secondary px-6 py-3 font-body font-bold text-secondary transition-colors hover:bg-secondary hover:text-white"
        >
          Comprar ahora
        </button>
      </div>

      <div className="mt-5 flex items-center gap-2 font-body text-sm text-muted-foreground">
        <Truck className="h-4 w-4 text-accent" strokeWidth={1.75} />
        Envío gratis en Lima Metropolitana desde S/.150
      </div>

      {/* Banner de regalo — PLAN.md sección 5.4.1. Cuando exista más de un regalo
          elegible, este bloque pasa a ser un carrusel donde el cliente elige. */}
      <div className="mt-4 flex items-start gap-3 rounded-xl border-2 border-dashed border-accent bg-accent/10 p-4">
        <Gift className="h-6 w-6 shrink-0 text-secondary" strokeWidth={1.75} />
        <div>
          <p className="font-body text-sm font-bold text-secondary">
            Regalo gratis en compras desde S/.150
          </p>
          <p className="font-body text-xs text-muted-foreground">
            Te regalamos una bandana para tu mascota. Se añade automáticamente a tu carrito.
          </p>
        </div>
      </div>
    </div>
  );
}
