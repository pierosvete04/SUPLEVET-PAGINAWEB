"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CategoriaProducto, MetodoPago } from "@/lib/data/productos-shared";
import type { TallaBandana } from "@/lib/regalo-variantes";
import { createClient } from "@/lib/supabase/client";

export interface BandanaSeleccion {
  slug: string;
  talla: TallaBandana;
}

export interface CartItem {
  slug: string;
  nombre: string;
  precio: number;
  imagen: string;
  cantidad: number;
  /** Opcional por compatibilidad con carritos guardados en localStorage antes
   * de esta feature — ausente se trata como "producto" (no cuenta para
   * combosQty, ver más abajo). */
  categoria?: CategoriaProducto;
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
  /** Suma de cantidades de items con categoria === "combo" — gobierna cuántas
   * bandanas de regalo puede elegir el cliente (una por combo comprado). */
  combosQty: number;
  /** Longitud fija = combosQty (ver resize en el efecto de abajo); slots sin
   * elegir aún son null. */
  bandanasSeleccionadas: (BandanaSeleccion | null)[];
  setBandanaEnSlot: (index: number, seleccion: BandanaSeleccion | null) => void;
  /** Vacía toda la selección — se usa al confirmar un pedido con éxito. */
  limpiarBandanas: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "suplevet_carrito";
const STORAGE_KEY_BANDANAS = "suplevet_bandanas_regalo";

// Espera antes de sincronizar el carrito a Supabase. Sin la pausa, subir la
// cantidad de un producto de 1 a 4 dispararía cuatro escrituras seguidas.
const SYNC_DEBOUNCE_MS = 2500;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hidratado, setHidratado] = useState(false);
  const [bandanasSeleccionadas, setBandanasSeleccionadasState] = useState<(BandanaSeleccion | null)[]>(
    []
  );

  // Carga inicial desde localStorage — el carrito es solo del navegador por
  // ahora (Fase 2 lo persiste en Supabase junto con el checkout real).
  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(STORAGE_KEY);
      if (guardado) setItems(JSON.parse(guardado));
      const bandanasGuardadas = window.localStorage.getItem(STORAGE_KEY_BANDANAS);
      if (bandanasGuardadas) setBandanasSeleccionadasState(JSON.parse(bandanasGuardadas));
    } catch {
      // localStorage no disponible o dato corrupto — se empieza con carrito vacío
    }
    setHidratado(true);
  }, []);

  useEffect(() => {
    if (!hidratado) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hidratado]);

  function persistirBandanas(siguiente: (BandanaSeleccion | null)[]) {
    setBandanasSeleccionadasState(siguiente);
    window.localStorage.setItem(STORAGE_KEY_BANDANAS, JSON.stringify(siguiente));
  }

  function setBandanaEnSlot(index: number, seleccion: BandanaSeleccion | null) {
    const siguiente = [...bandanasSeleccionadas];
    while (siguiente.length <= index) siguiente.push(null);
    siguiente[index] = seleccion;
    persistirBandanas(siguiente);
  }

  function limpiarBandanas() {
    persistirBandanas([]);
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
  const combosQty = useMemo(
    () => items.filter((i) => i.categoria === "combo").reduce((acc, i) => acc + i.cantidad, 0),
    [items]
  );

  // Recorta (o extiende con null) el array de selección para que su longitud
  // siga siempre a combosQty — sin esto, bajar la cantidad de combos dejaría
  // slots "fantasma" seleccionados que ya no corresponden a ningún combo real.
  useEffect(() => {
    if (!hidratado) return;
    if (bandanasSeleccionadas.length === combosQty) return;
    const siguiente = Array.from({ length: combosQty }, (_, i) => bandanasSeleccionadas[i] ?? null);
    persistirBandanas(siguiente);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidratado, combosQty]);

  // El backend (registrar_pedido_web) ya revalida cada bandana antes de
  // grabarla, así que esto no es lo que evita que se "cuele" gratis — es
  // solo para que la UI no siga mostrando slots elegidos cuando el regalo dejó
  // de calificar (se quitaron los combos del carrito, el regalo se desactivó,
  // etc). Sin esto, la selección quedaba pegada en localStorage sin importar
  // si el carrito seguía calificando.
  useEffect(() => {
    if (!hidratado) return;
    const slugsElegidos = bandanasSeleccionadas
      .filter((b): b is BandanaSeleccion => b !== null)
      .map((b) => b.slug);
    if (slugsElegidos.length === 0) return;
    let cancelado = false;
    createClient()
      .from("regalo_variantes")
      .select("slug, activo, regalos(activo, condicion_tipo, condicion_monto_minimo, condicion_categoria)")
      .in("slug", slugsElegidos)
      .then(({ data }) => {
        if (cancelado || !data) return;
        const calificaPorSlug = new Map<string, boolean>();
        for (const fila of data as unknown as {
          slug: string;
          activo: boolean;
          regalos: {
            activo: boolean;
            condicion_tipo: string;
            condicion_monto_minimo: number | null;
            condicion_categoria: string | null;
          } | null;
        }[]) {
          const regalo = fila.regalos;
          const califica =
            fila.activo &&
            !!regalo?.activo &&
            (regalo.condicion_tipo === "evento" ||
              (regalo.condicion_tipo === "monto_minimo" && subtotal >= (regalo.condicion_monto_minimo ?? 0)) ||
              (regalo.condicion_tipo === "categoria" && regalo.condicion_categoria === "combo" && combosQty > 0));
          calificaPorSlug.set(fila.slug, califica);
        }
        const siguiente = bandanasSeleccionadas.map((b) =>
          b && calificaPorSlug.get(b.slug) === false ? null : b
        );
        if (siguiente.some((b, i) => b !== bandanasSeleccionadas[i])) {
          persistirBandanas(siguiente);
        }
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidratado, subtotal, combosQty]);

  // Copia del carrito en Supabase para clientes con sesión. localStorage sigue
  // siendo la fuente de verdad de la UI; esta fila existe solo para que el
  // servidor pueda ver un carrito abandonado y mandar el recordatorio — antes
  // el carrito vivía únicamente en el navegador y no había nada que detectar.
  //
  // Los invitados no se sincronizan a propósito: sin cuenta no hay correo al
  // que escribir, y guardar carritos anónimos sería recolectar datos que no
  // podemos usar.
  //
  // Al completar un pedido el checkout vacía el carrito, así que la siguiente
  // sincronización guarda `[]` y la fila deja de calificar. Si el cliente sale
  // hacia Mercado Pago antes de que corra el debounce, la fila queda con los
  // items viejos — de ahí que encolar_carritos_abandonados() además descarte a
  // quien haya generado un pedido después de la última modificación.
  useEffect(() => {
    if (!hidratado) return;

    let cancelado = false;
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelado || !user) return;

      await supabase
        .from("carritos")
        .upsert({ cliente_id: user.id, items, subtotal }, { onConflict: "cliente_id" });
    }, SYNC_DEBOUNCE_MS);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [hidratado, items, subtotal]);

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
        combosQty,
        bandanasSeleccionadas,
        setBandanaEnSlot,
        limpiarBandanas,
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
