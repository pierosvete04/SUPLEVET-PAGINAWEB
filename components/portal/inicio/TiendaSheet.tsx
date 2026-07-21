"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart/CartContext";
import { formatPrecio, type MetodoPago } from "@/lib/data/productos-shared";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RegaloBandanaSelector } from "@/components/cart/RegaloBandanaSelector";
import { BrandedLoader } from "@/components/ui/branded-loader";

interface ProductoTienda {
  slug: string;
  nombre: string;
  categoria: "producto" | "combo";
  precio: number;
  precio_comparacion: number;
  imagen: string;
  descuento_porcentaje: number;
  metodos_pago_permitidos: MetodoPago[];
}

interface TiendaSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Sidebar de compra rápida desde el portal — muestra el catálogo (productos y
// combos) para añadir al carrito sin salir de /mi-cuenta; "Continuar al
// checkout" lleva al checkout real (mismo carrito global de lib/cart/CartContext).
export function TiendaSheet({ open, onOpenChange }: TiendaSheetProps) {
  const [productos, setProductos] = useState<ProductoTienda[]>([]);
  const [cargando, setCargando] = useState(true);
  const { items, addItem, updateQuantity, removeItem, subtotal, totalItems } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    createClient()
      .from("productos_web")
      .select(
        "slug, nombre, categoria, precio, precio_comparacion, imagen, descuento_porcentaje, metodos_pago_permitidos"
      )
      .eq("activo", true)
      .order("orden", { ascending: true })
      .then(({ data }) => {
        setProductos((data as ProductoTienda[]) ?? []);
        setCargando(false);
      });
  }, [open]);

  function cantidadEnCarrito(slug: string): number {
    return items.find((i) => i.slug === slug)?.cantidad ?? 0;
  }

  function irAPagar() {
    onOpenChange(false);
    router.push("/checkout");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Comprar Suplevet</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {cargando ? (
            <BrandedLoader compact label="Cargando productos…" className="justify-center" />
          ) : (
            <div className="flex flex-col gap-3">
              {productos.map((p) => {
                const cantidad = cantidadEnCarrito(p.slug);
                return (
                  <div
                    key={p.slug}
                    className="flex items-center gap-3 rounded-lg border border-portal-surface-variant p-3"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-portal-surface-low">
                      <Image src={p.imagen} alt={p.nombre} fill className="object-cover" sizes="64px" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-portal-navy">{p.nombre}</p>
                      <p className="text-xs text-portal-muted">{formatPrecio(p.precio)}</p>
                    </div>
                    {cantidad === 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          addItem({
                            slug: p.slug,
                            nombre: p.nombre,
                            precio: p.precio,
                            imagen: p.imagen,
                            metodosPagoPermitidos: p.metodos_pago_permitidos,
                          })
                        }
                        className="shrink-0 rounded-[17px] bg-portal-navy-dark px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-portal-navy"
                      >
                        Añadir
                      </button>
                    ) : (
                      <div className="flex shrink-0 items-center rounded-[17px] border border-portal-surface-variant">
                        <button
                          type="button"
                          aria-label="Restar cantidad"
                          onClick={() =>
                            cantidad <= 1 ? removeItem(p.slug) : updateQuantity(p.slug, cantidad - 1)
                          }
                          className="flex h-8 w-8 items-center justify-center text-portal-navy"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-portal-navy">{cantidad}</span>
                        <button
                          type="button"
                          aria-label="Sumar cantidad"
                          onClick={() => updateQuantity(p.slug, cantidad + 1)}
                          className="flex h-8 w-8 items-center justify-center text-portal-navy"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-portal-surface-variant pt-4">
          <div className="flex justify-between text-sm text-portal-navy">
            <span>Subtotal ({totalItems} {totalItems === 1 ? "producto" : "productos"})</span>
            <span className="font-bold">{formatPrecio(subtotal)}</span>
          </div>

          <div className="mt-3">
            <RegaloBandanaSelector />
          </div>

          <button
            type="button"
            disabled={totalItems === 0}
            onClick={irAPagar}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-[17px] bg-portal-orange px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingBag className="h-4 w-4" />
            Continuar al checkout
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
