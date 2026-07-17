"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Gift } from "lucide-react";
import { useCart } from "@/lib/cart/CartContext";
import { formatPrecio } from "@/lib/data/productos-shared";
import { createClient } from "@/lib/supabase/client";
import { getRegalosPorMontoMinimo } from "@/lib/regalos";
import { BANDANAS_REGALO } from "@/lib/data/bandanas-regalo";

// Selector del diseño de bandana de regalo — vive en el carrito (drawer y
// /carrito) porque depende del subtotal, no de un producto en particular.
// Debajo del monto mínimo solo se ve la barra de progreso; al alcanzarlo se
// habilita el toggle "Ver regalos" que despliega las 4 tarjetas para elegir
// diseño (patrón inspirado en las tiendas de plugins de audio: sección
// colapsable + barra "te falta X para desbloquear" + lista con radio).
export function RegaloBandanaSelector() {
  const { subtotal, bandanaRegaloSeleccionada, setBandanaRegaloSeleccionada } = useCart();
  const [montoMinimo, setMontoMinimo] = useState<number | null>(null);
  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    getRegalosPorMontoMinimo(createClient()).then((regalos) => {
      const montos = regalos
        .map((r) => r.condicion_monto_minimo)
        .filter((m): m is number => m !== null);
      setMontoMinimo(montos.length > 0 ? Math.min(...montos) : null);
    });
  }, []);

  if (montoMinimo === null) return null;

  const faltante = Math.max(montoMinimo - subtotal, 0);
  const calificaParaRegalo = faltante === 0;
  const progreso = Math.min(subtotal / montoMinimo, 1) * 100;
  const bandanaElegida = BANDANAS_REGALO.find((b) => b.slug === bandanaRegaloSeleccionada);

  return (
    <div className="rounded-[17px] border border-border bg-soft-gray p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 font-body text-xs font-bold text-secondary">
          <Gift className="h-4 w-4 text-secondary" strokeWidth={1.75} />
          Elige tu regalo
        </p>
        {calificaParaRegalo && (
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

      {!calificaParaRegalo && (
        <p className="mt-1 font-body text-xs text-secondary">
          Te faltan <strong>{formatPrecio(faltante)}</strong> para desbloquear tu regalo gratis:{" "}
          <strong>bandana de regalo</strong>
        </p>
      )}

      <div className="relative mt-2.5 h-2.5 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${progreso}%` }}
        />
      </div>

      {calificaParaRegalo && !expandido && (
        <p className="mt-2 font-body text-xs text-secondary">
          {bandanaElegida ? (
            <>
              🎉 Tu regalo: <strong>Bandana {bandanaElegida.nombre}</strong>
            </>
          ) : (
            <>🎉 ¡Desbloqueaste tu regalo! Elige el diseño en &ldquo;Ver regalos&rdquo;.</>
          )}
        </p>
      )}

      {calificaParaRegalo && expandido && (
        <div className="mt-3 flex flex-col gap-2">
          {BANDANAS_REGALO.map((bandana) => {
            const seleccionada = bandanaRegaloSeleccionada === bandana.slug;
            return (
              <button
                key={bandana.slug}
                type="button"
                role="radio"
                aria-checked={seleccionada}
                onClick={() => setBandanaRegaloSeleccionada(bandana.slug)}
                className={`flex items-center gap-3 rounded-[17px] border bg-white p-2 text-left transition-colors ${
                  seleccionada ? "border-accent ring-1 ring-accent" : "border-border hover:border-secondary/40"
                }`}
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[17px] bg-soft-gray">
                  <Image
                    src={bandana.imagen}
                    alt={`Bandana ${bandana.nombre}`}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="flex-1">
                  <span className="flex items-center gap-1 font-body text-[10px] font-bold text-green-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                    Desbloqueado
                  </span>
                  <p className="font-body text-sm font-bold text-secondary">Bandana {bandana.nombre}</p>
                  <p className="font-body text-xs text-muted-foreground">Gratis</p>
                </div>
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    seleccionada ? "border-accent" : "border-border"
                  }`}
                >
                  {seleccionada && <span className="h-2 w-2 rounded-full bg-accent" />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
