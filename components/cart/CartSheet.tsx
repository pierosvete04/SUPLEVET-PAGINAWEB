"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, PawPrint, Gift, Check } from "lucide-react";
import { useCart } from "@/lib/cart/CartContext";
import { formatPrecio } from "@/lib/data/productos-shared";
import { createClient } from "@/lib/supabase/client";
import { getRegalosPorMontoMinimo } from "@/lib/regalos";
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

// Colores fijos de bandana — sin gestión desde admin por ahora.
const BANDANA_COLORES = [
  { nombre: "Rojo", hex: "#D33F3F" },
  { nombre: "Azul", hex: "#2563EB" },
  { nombre: "Verde", hex: "#16A34A" },
  { nombre: "Negro", hex: "#111827" },
];

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const { items, updateQuantity, removeItem, subtotal, colorRegaloSeleccionado, setColorRegaloSeleccionado } =
    useCart();
  const router = useRouter();
  const [montoMinimoRegalo, setMontoMinimoRegalo] = useState<number | null>(null);

  useEffect(() => {
    getRegalosPorMontoMinimo(createClient()).then((regalos) => {
      const montos = regalos
        .map((r) => r.condicion_monto_minimo)
        .filter((m): m is number => m !== null);
      setMontoMinimoRegalo(montos.length > 0 ? Math.min(...montos) : null);
    });
  }, []);

  const calificaParaRegalo = montoMinimoRegalo !== null && subtotal >= montoMinimoRegalo;

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
              className="rounded-full bg-primary px-5 py-2.5 font-body text-sm font-bold text-primary-foreground hover:opacity-90"
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
                      <div className="mt-1.5 flex items-center rounded-full border border-border w-fit">
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

              {calificaParaRegalo && (
                <div className="mt-3 rounded-[var(--radius-card,1rem)] border-2 border-dashed border-accent bg-accent/10 p-3">
                  <p className="flex items-center gap-1.5 font-body text-xs font-bold text-secondary">
                    <Gift className="h-4 w-4 text-secondary" strokeWidth={1.75} />
                    Elige el color de tu bandana de regalo
                  </p>
                  <div className="mt-2 flex gap-2">
                    {BANDANA_COLORES.map((color) => (
                      <button
                        key={color.nombre}
                        type="button"
                        aria-label={`Bandana ${color.nombre}`}
                        onClick={() => setColorRegaloSeleccionado(color.nombre)}
                        className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-sm ring-1 ring-border"
                        style={{ backgroundColor: color.hex }}
                      >
                        {colorRegaloSeleccionado === color.nombre && (
                          <Check className="h-4 w-4 text-white" strokeWidth={3} />
                        )}
                      </button>
                    ))}
                  </div>
                  {!colorRegaloSeleccionado && (
                    <p className="mt-1.5 font-body text-[11px] text-muted-foreground">
                      Selecciona un color, se añade gratis a tu pedido.
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handlePagarPedido}
                className="mt-4 w-full rounded-full bg-primary px-6 py-3 font-body font-bold text-primary-foreground hover:opacity-90"
              >
                Pagar pedido
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
