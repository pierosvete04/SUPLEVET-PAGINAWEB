"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Gift } from "lucide-react";
import { useCart, type BandanaSeleccion } from "@/lib/cart/CartContext";
import { formatPrecio } from "@/lib/data/productos-shared";
import { createClient } from "@/lib/supabase/client";
import { getRegalosDisponiblesEnCarrito, type Regalo } from "@/lib/regalos";
import {
  agruparVariantesPorDiseno,
  getVariantesActivas,
  tallaBandanaDisponible,
  type DisenoBandana,
  type RegaloVariante,
  type TallaBandana,
} from "@/lib/regalo-variantes";

const TALLAS: TallaBandana[] = ["S", "M", "L"];

interface RegaloBandanaSelectorProps {
  /** "carrito": colapsable, con progreso/mensaje corto (drawer y /carrito).
   * "checkout": siempre expandido, como paso propio del checkout. */
  variant?: "carrito" | "checkout";
  /** Se llama con la cantidad de slots que hay que llenar para poder pagar
   * (0 si no hay ningún regalo activo/calificado) — permite al checkout
   * gatear "Pagar ahora" sin asumir que siempre hay un regalo de categoría
   * activo (si se desactiva con combos en el carrito, no debe bloquear la
   * compra para siempre). */
  onSlotsRequeridos?: (n: number) => void;
}

// Selector de bandanas de regalo — vive en el carrito (drawer, /carrito) y
// como paso propio del checkout. Soporta N slots: uno por cada combo
// comprado si el regalo activo es de categoría ("cualquier combo"), o uno
// solo si es de monto mínimo / evento (comportamiento histórico). Cada slot
// elige diseño + talla (S, M o L) de forma independiente.
export function RegaloBandanaSelector({ variant = "carrito", onSlotsRequeridos }: RegaloBandanaSelectorProps) {
  const { subtotal, combosQty, bandanasSeleccionadas, setBandanaEnSlot } = useCart();
  const [regalo, setRegalo] = useState<Regalo | null>(null);
  const [variantes, setVariantes] = useState<RegaloVariante[]>([]);
  const [expandido, setExpandido] = useState(variant === "checkout");

  useEffect(() => {
    const supabase = createClient();
    getRegalosDisponiblesEnCarrito(supabase).then((regalos) => {
      const evento = regalos.find((r) => r.condicion_tipo === "evento");
      const porCategoria = regalos.find((r) => r.condicion_tipo === "categoria");
      const porMonto = regalos
        .filter((r) => r.condicion_tipo === "monto_minimo")
        .sort((a, b) => (a.condicion_monto_minimo ?? 0) - (b.condicion_monto_minimo ?? 0))[0];
      const elegido = evento ?? porCategoria ?? porMonto ?? null;
      setRegalo(elegido);
      if (elegido) getVariantesActivas(supabase, elegido.id).then(setVariantes);
    });
  }, []);

  const disenos = useMemo(() => agruparVariantesPorDiseno(variantes), [variantes]);

  const esEvento = regalo?.condicion_tipo === "evento";
  const esCategoria = regalo?.condicion_tipo === "categoria";
  const montoMinimo = regalo?.condicion_monto_minimo ?? 0;
  const faltante = !regalo || esEvento || esCategoria ? 0 : Math.max(montoMinimo - subtotal, 0);
  const calificaParaRegalo = !!regalo && (esEvento || (esCategoria ? combosQty > 0 : faltante === 0));
  const progreso =
    esEvento || esCategoria ? 100 : montoMinimo > 0 ? Math.min(subtotal / montoMinimo, 1) * 100 : 100;
  const slotsCount = esCategoria ? combosQty : 1;

  useEffect(() => {
    onSlotsRequeridos?.(calificaParaRegalo ? slotsCount : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calificaParaRegalo, slotsCount]);

  if (!regalo) return null;
  if (!calificaParaRegalo && variant === "checkout") return null;

  return (
    <div className="rounded-[17px] border border-border bg-soft-gray p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 font-body text-xs font-bold text-secondary">
          <Gift className="h-4 w-4 text-secondary" strokeWidth={1.75} />
          {variant === "checkout" ? "Elige tus bandanas" : "Elige tu regalo"}
        </p>
        {calificaParaRegalo && variant === "carrito" && (
          <button
            type="button"
            onClick={() => setExpandido((v) => !v)}
            className="flex shrink-0 items-center gap-1 rounded-[17px] bg-secondary px-3 py-1.5 font-body text-[11px] font-bold text-white hover:opacity-90"
          >
            {expandido ? "Ocultar regalos" : "Ver regalos"}
            {expandido ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </div>

      {!calificaParaRegalo && esCategoria && (
        <p className="mt-1 font-body text-xs text-secondary">
          Agrega cualquier combo a tu carrito para desbloquear tu bandana gratis:{" "}
          <strong>{regalo.nombre}</strong>
        </p>
      )}

      {!calificaParaRegalo && !esCategoria && (
        <p className="mt-1 font-body text-xs text-secondary">
          Te faltan <strong>{formatPrecio(faltante)}</strong> para desbloquear tu regalo gratis:{" "}
          <strong>{regalo.nombre}</strong>
        </p>
      )}

      {!esEvento && !esCategoria && (
        <div className="relative mt-2.5 h-2.5 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${progreso}%` }}
          />
        </div>
      )}

      {calificaParaRegalo && !expandido && (
        <p className="mt-2 font-body text-xs text-secondary">
          🎉 ¡Desbloqueaste tu bandana gratis! Elige diseño y talla en &ldquo;Ver regalos&rdquo;.
        </p>
      )}

      {calificaParaRegalo && expandido && (
        <div className="mt-3 flex flex-col gap-4">
          {Array.from({ length: slotsCount }, (_, i) => i).map((slot) => (
            <SlotBandana
              key={slot}
              indice={slot}
              etiqueta={slotsCount > 1 ? `Bandana #${slot + 1}` : "Tu bandana"}
              disenos={disenos}
              seleccion={bandanasSeleccionadas[slot] ?? null}
              onCambiar={(seleccion) => setBandanaEnSlot(slot, seleccion)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SlotBandanaProps {
  indice: number;
  etiqueta: string;
  disenos: DisenoBandana[];
  seleccion: BandanaSeleccion | null;
  onCambiar: (seleccion: BandanaSeleccion | null) => void;
}

function SlotBandana({ etiqueta, disenos, seleccion, onCambiar }: SlotBandanaProps) {
  const disenoElegido = disenos.find((d) =>
    TALLAS.some((t) => d.porTalla[t]?.slug === seleccion?.slug)
  )?.nombre;

  function elegirDiseno(diseno: DisenoBandana) {
    const talla = TALLAS.find((t) => tallaBandanaDisponible(diseno, t));
    const variante = talla ? diseno.porTalla[talla] : undefined;
    if (variante && talla) onCambiar({ slug: variante.slug, talla });
  }

  function elegirTalla(diseno: DisenoBandana, talla: TallaBandana) {
    const variante = diseno.porTalla[talla];
    if (variante && tallaBandanaDisponible(diseno, talla)) onCambiar({ slug: variante.slug, talla });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="font-body text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {etiqueta}
      </p>
      <div className="flex flex-col gap-2">
        {disenos.map((diseno) => {
          const elegido = disenoElegido === diseno.nombre;
          const sinStock = TALLAS.every((t) => !tallaBandanaDisponible(diseno, t));
          return (
            <div
              key={diseno.nombre}
              className={`flex items-center gap-3 rounded-[17px] border bg-white p-2 transition-colors ${
                elegido ? "border-accent ring-1 ring-accent" : "border-border"
              } ${sinStock ? "opacity-50" : ""}`}
            >
              <button
                type="button"
                role="radio"
                aria-checked={elegido}
                disabled={sinStock}
                onClick={() => elegirDiseno(diseno)}
                className="flex flex-1 items-center gap-3 text-left disabled:cursor-not-allowed"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[17px] bg-soft-gray">
                  {diseno.imagen && (
                    <Image
                      src={diseno.imagen}
                      alt={diseno.nombre}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-body text-sm font-bold text-secondary">Bandana {diseno.nombre}</p>
                  <p className="font-body text-xs text-muted-foreground">
                    {sinStock ? "Agotado" : "Gratis"}
                  </p>
                </div>
              </button>
              {elegido && (
                <div className="flex shrink-0 gap-1">
                  {TALLAS.map((talla) => {
                    const disponible = tallaBandanaDisponible(diseno, talla);
                    const activa = seleccion?.talla === talla;
                    return (
                      <button
                        key={talla}
                        type="button"
                        disabled={!disponible}
                        onClick={() => elegirTalla(diseno, talla)}
                        className={`rounded-[10px] border px-2.5 py-1 font-body text-[11px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          activa
                            ? "border-accent bg-accent text-white"
                            : "border-border text-secondary hover:border-secondary/40"
                        }`}
                      >
                        {talla}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
