"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, PawPrint, Star } from "lucide-react";
import { useCart } from "@/lib/cart/CartContext";
import { formatPrecio } from "@/lib/data/productos-shared";
import { ShippingProgressBar } from "@/components/shared/ShippingProgressBar";
import { RegaloBandanaSelector } from "@/components/cart/RegaloBandanaSelector";
import { BENEFICIOS_CARRITO_VACIO } from "@/lib/cart/beneficios-carrito-vacio";

export default function CarritoPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-container px-mobile-margin py-section-y md:px-gutter">
        <div className="relative mx-auto max-w-2xl overflow-hidden rounded-[10px] border border-border bg-white px-6 py-14 text-center sm:px-10">
          <div className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-14 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative mx-auto max-w-md">
            <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-soft-gray">
              <PawPrint className="h-9 w-9 text-accent" strokeWidth={1.5} />
              <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white shadow-sm">
                <Star className="h-3.5 w-3.5 fill-white" strokeWidth={0} />
              </span>
            </div>

            <h1 className="font-display text-2xl font-bold text-secondary sm:text-3xl">
              Tu carrito está vacío
            </h1>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              Elige productos para tu mascota y empieza a sumar beneficios en cada compra.
            </p>

            <ul className="mt-6 space-y-3 text-left">
              {BENEFICIOS_CARRITO_VACIO.map(({ icono: Icono, texto }) => (
                <li
                  key={texto}
                  className="flex items-start gap-3 rounded-[17px] bg-soft-gray p-3"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-accent shadow-sm">
                    <Icono className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span className="font-body text-sm text-secondary">{texto}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/productos"
              className="mt-7 inline-flex w-full items-center justify-center rounded-[17px] bg-primary px-6 py-3 font-body font-bold text-primary-foreground hover:opacity-90 sm:w-auto"
            >
              Ver productos
            </Link>
          </div>
        </div>
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
