"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, PawPrint } from "lucide-react";
import { useCart } from "@/lib/cart/CartContext";
import { formatPrecio } from "@/lib/data/productos-shared";
import { RegaloBandanaSelector } from "@/components/cart/RegaloBandanaSelector";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const router = useRouter();

  function handlePagarPedido() {
    onOpenChange(false);
    router.push("/checkout");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Tu carrito</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <PawPrint className="h-10 w-10 text-accent" strokeWidth={1.5} />
            <p className="font-body text-sm text-muted-foreground">Tu carrito está vacío.</p>
            <Link
              href="/productos"
              onClick={() => onOpenChange(false)}
              className="rounded-[17px] bg-primary px-5 py-2.5 font-body text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Ver productos
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-4">
                {items.map((item) => (
                  <div key={item.slug} className="flex items-center gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-soft-gray">
                      <Image src={item.imagen} alt={item.nombre} fill className="object-cover" sizes="64px" />
                    </div>
                    <div className="flex-1">
                      <p className="font-body text-sm font-bold text-secondary">{item.nombre}</p>
                      <p className="font-body text-xs text-muted-foreground">
                        {formatPrecio(item.precio)} c/u
                      </p>
                      <div className="mt-1.5 flex items-center rounded-[17px] border border-border w-fit">
                        <button
                          type="button"
                          aria-label="Restar cantidad"
                          onClick={() => updateQuantity(item.slug, item.cantidad - 1)}
                          className="flex h-7 w-7 items-center justify-center text-secondary"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center font-body text-xs font-bold">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          aria-label="Sumar cantidad"
                          onClick={() => updateQuantity(item.slug, item.cantidad + 1)}
                          className="flex h-7 w-7 items-center justify-center text-secondary"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-body text-sm font-bold text-primary">
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
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between font-body text-sm text-secondary">
                <span>Subtotal</span>
                <span className="font-bold">{formatPrecio(subtotal)}</span>
              </div>
              <p className="mt-1 font-body text-xs text-muted-foreground">
                El envío se calcula en el checkout según tu dirección.
              </p>

              <div className="mt-3">
                <RegaloBandanaSelector />
              </div>

              <button
                type="button"
                onClick={handlePagarPedido}
                className="mt-4 w-full rounded-[17px] bg-primary px-6 py-3 font-body font-bold text-primary-foreground hover:opacity-90"
              >
                Continuar al checkout
              </button>
              <Link
                href="/carrito"
                onClick={() => onOpenChange(false)}
                className="mt-2 block text-center font-body text-xs font-bold text-secondary underline"
              >
                Ver carrito completo
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
