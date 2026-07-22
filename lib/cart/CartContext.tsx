"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { MetodoPago } from "@/lib/data/productos-shared";
import { createClient } from "@/lib/supabase/client";

export interface CartItem {
  slug: string;
  nombre: string;
  precio: number;
  imagen: string;
  cantidad: number;
  /** Opcional por compatibilidad con carritos guardados en localStorage antes
   * de esta feature — ausente se trata como "admite todos" (ver
   * app/checkout/page.tsx). */
  metodosPagoPermitidos?: MetodoPago[];
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "cantidad">, cantidad?: number) => void;
  removeItem: (slug: string) => void;
  updateQuantity: (slug: string, cantidad: number) => void;
  subtotal: number;
  totalItems: number;
  /** false hasta que se termina de leer localStorage — evita que páginas como
   * /checkout redirijan por "carrito vacío" antes de que cargue el real. */
  cargando: boolean;
  /** Slug de la variante de regalo elegida (ver lib/regalo-variantes.ts) — null si no ha elegido. */
  bandanaRegaloSeleccionada: string | null;
  setBandanaRegaloSeleccionada: (slug: string | null) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "suplevet_carrito";
const STORAGE_KEY_REGALO = "suplevet_bandana_regalo";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hidratado, setHidratado] = useState(false);
  const [bandanaRegaloSeleccionada, setBandanaRegaloSeleccionadaState] = useState<string | null>(null);

  // Carga inicial desde localStorage — el carrito es solo del navegador por
  // ahora (Fase 2 lo persiste en Supabase junto con el checkout real).
  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(STORAGE_KEY);
      if (guardado) setItems(JSON.parse(guardado));
      const bandanaGuardada = window.localStorage.getItem(STORAGE_KEY_REGALO);
      if (bandanaGuardada) setBandanaRegaloSeleccionadaState(bandanaGuardada);
    } catch {
      // localStorage no disponible o dato corrupto — se empieza con carrito vacío
    }
    setHidratado(true);
  }, []);

  useEffect(() => {
    if (!hidratado) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hidratado]);

  function setBandanaRegaloSeleccionada(slug: string | null) {
    setBandanaRegaloSeleccionadaState(slug);
    if (slug) window.localStorage.setItem(STORAGE_KEY_REGALO, slug);
    else window.localStorage.removeItem(STORAGE_KEY_REGALO);
  }

  function addItem(item: Omit<CartItem, "cantidad">, cantidad = 1) {
    setItems((prev) => {
      const existente = prev.find((i) => i.slug === item.slug);
      if (existente) {
        return prev.map((i) =>
          i.slug === item.slug ? { ...i, cantidad: i.cantidad + cantidad } : i
        );
      }
      return [...prev, { ...item, cantidad }];
    });
  }

  function removeItem(slug: string) {
    setItems((prev) => prev.filter((i) => i.slug !== slug));
  }

  function updateQuantity(slug: string, cantidad: number) {
    if (cantidad < 1) return;
    setItems((prev) => prev.map((i) => (i.slug === slug ? { ...i, cantidad } : i)));
  }

  const subtotal = useMemo(
    () => items.reduce((acc, i) => acc + i.precio * i.cantidad, 0),
    [items]
  );
  const totalItems = useMemo(() => items.reduce((acc, i) => acc + i.cantidad, 0), [items]);

  // El backend (registrar_pedido_web) ya revalida el regalo antes de
  // grabarlo, así que esto no es lo que evita que se "cuele" gratis — es
  // solo para que la UI no siga mostrando "Gratis"/incluido en el resumen
  // cuando el cliente bajó el subtotal (quitó productos) después de haber
  // elegido el regalo. Sin esto, la selección quedaba pegada en localStorage
  // sin importar si el carrito seguía calificando.
  useEffect(() => {
    if (!hidratado || !bandanaRegaloSeleccionada) return;
    let cancelado = false;
    createClient()
      .from("regalo_variantes")
      .select("regalos(activo, condicion_tipo, condicion_monto_minimo)")
      .eq("slug", bandanaRegaloSeleccionada)
      .eq("activo", true)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelado) return;
        const regalo = data?.regalos as unknown as {
          activo: boolean;
          condicion_tipo: string;
          condicion_monto_minimo: number | null;
        } | null;
        const califica =
          !!regalo?.activo &&
          (regalo.condicion_tipo === "evento" || subtotal >= (regalo.condicion_monto_minimo ?? 0));
        if (!califica) setBandanaRegaloSeleccionada(null);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidratado, subtotal, bandanaRegaloSeleccionada]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        subtotal,
        totalItems,
        cargando: !hidratado,
        bandanaRegaloSeleccionada,
        setBandanaRegaloSeleccionada,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
