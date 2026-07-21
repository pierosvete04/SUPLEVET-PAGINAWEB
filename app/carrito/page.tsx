"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, PawPrint } from "lucide-react";
import { useCart } from "@/lib/cart/CartContext";
import { formatPrecio } from "@/lib/data/productos-shared";
import { ShippingProgressBar } from "@/components/shared/ShippingProgressBar";
import { RegaloBandanaSelector } from "@/components/cart/RegaloBandanaSelector";

export default function CarritoPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-container flex-col items-center gap-4 px-mobile-margin py-section-y text-center">
        <PawPrint className="h-12 w-12 text-accent" strokeWidth={1.5} />
        <h1 className="font-display text-2xl font-bold text-secondary">Tu carrito está vacío</h1>
        <Link
          href="/productos"
          className="mt-2 rounded-[17px] bg-primary px-6 py-3 font-body font-bold text-primary-foreground hover:opacity-90"
        >
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-container px-mobile-margin py-section-y md:px-gutter">
      <h1 className="font-display text-3xl font-bold text-secondary">Carrito</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {items.map((item) => (
            <div
              key={item.slug}
              className="flex items-center gap-4 rounded-md border border-border p-4"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-soft-gray">
                <Image src={item.imagen} alt={item.nombre} fill className="object-cover" sizes="80px" />
              </div>
              <div className="flex-1">
                <p className="font-body font-bold text-secondary">{item.nombre}</p>
                <p className="font-body text-sm text-muted-foreground">
                  {formatPrecio(item.precio)} c/u
                </p>
                <div className="mt-2 flex items-center rounded-[17px] border border-border w-fit">
                  <button
                    type="button"
                    aria-label="Restar cantidad"
                    onClick={() => updateQuantity(item.slug, item.cantidad - 1)}
                    className="flex h-8 w-8 items-center justify-center text-secondary"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center font-body text-sm font-bold">
                    {item.cantidad}
                  </span>
                  <button
                    type="button"
                    aria-label="Sumar cantidad"
                    onClick={() => updateQuantity(item.slug, item.cantidad + 1)}
                    className="flex h-8 w-8 items-center justify-center text-secondary"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <span className="font-body font-bold text-secondary">
                  {formatPrecio(item.precio * item.cantidad)}
                </span>
                <button
                  type="button"
                  aria-label={`Eliminar ${item.nombre}`}
                  onClick={() => removeItem(item.slug)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-border p-5">
            <div className="flex justify-between font-body text-sm text-secondary">
              <span>Subtotal</span>
              <span className="font-bold">{formatPrecio(subtotal)}</span>
            </div>
            <p className="mt-1 font-body text-xs text-muted-foreground">
              El envío se calcula en el checkout según tu dirección.
            </p>

            <p className="mt-4 font-body text-xs text-muted-foreground">
              ¿Tienes un código de descuento o de canje de SuplePoints? Lo aplicas en el siguiente
              paso, al confirmar tu pedido.
            </p>

            <Link
              href="/checkout"
              className="mt-5 block rounded-[17px] bg-primary px-6 py-3 text-center font-body font-bold text-primary-foreground hover:opacity-90"
            >
              Continuar al checkout
            </Link>
          </div>

          <RegaloBandanaSelector />

          <ShippingProgressBar subtotal={subtotal} />
        </div>
      </div>
    </div>
  );
}
