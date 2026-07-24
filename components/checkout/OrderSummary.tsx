"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Tag, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { BandanaSeleccion, CartItem } from "@/lib/cart/CartContext";
import { formatPrecio } from "@/lib/data/productos-shared";
import { getVariantesPorSlugs, type RegaloVariante } from "@/lib/regalo-variantes";

export interface DescuentoAplicado {
  codigo: string;
  descuentoSubtotal: number;
  costoEnvioFinal: number;
  mensaje: string;
}

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  envio?: number | null;
  clienteId: string;
  descuento: DescuentoAplicado | null;
  onDescuentoChange: (descuento: DescuentoAplicado | null) => void;
  bandanasRegaloSeleccionadas?: (BandanaSeleccion | null)[];
}

export function OrderSummary({
  items,
  subtotal,
  envio,
  clienteId,
  descuento,
  onDescuentoChange,
  bandanasRegaloSeleccionadas = [],
}: OrderSummaryProps) {
  const [bandanasRegalo, setBandanasRegalo] = useState<RegaloVariante[]>([]);
  const [codigoInput, setCodigoInput] = useState("");
  const [validando, setValidando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slugsElegidos = bandanasRegaloSeleccionadas
    .filter((b): b is BandanaSeleccion => b !== null)
    .map((b) => b.slug);

  useEffect(() => {
    if (slugsElegidos.length === 0) {
      setBandanasRegalo([]);
      return;
    }
    getVariantesPorSlugs(createClient(), slugsElegidos).then(setBandanasRegalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugsElegidos.join(",")]);

  const envioMostrado = descuento ? descuento.costoEnvioFinal : envio ?? null;
  const descuentoMonto = descuento?.descuentoSubtotal ?? 0;
  const total = Math.max(subtotal - descuentoMonto, 0) + (envioMostrado ?? 0);

  async function aplicarCodigo() {
    if (!codigoInput.trim() || envio == null) return;
    setValidando(true);
    setError(null);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("validar_codigo_descuento", {
      p_codigo: codigoInput.trim(),
      p_cliente_id: clienteId,
      p_subtotal: subtotal,
      p_costo_envio: envio,
    });

    if (rpcError || !data?.ok) {
      setError(data?.error ?? "No se pudo validar el código, intenta de nuevo.");
      setValidando(false);
      return;
    }

    onDescuentoChange({
      codigo: codigoInput.trim().toUpperCase(),
      descuentoSubtotal: data.descuento_subtotal,
      costoEnvioFinal: data.costo_envio_final,
      mensaje: data.mensaje,
    });
    setCodigoInput("");
    setValidando(false);
  }

  function quitarCodigo() {
    onDescuentoChange(null);
    setError(null);
  }

  return (
    <div className="rounded-md border border-border p-5">
      <h3 className="font-body text-sm font-bold uppercase tracking-wide text-secondary">
        Resumen de compra
      </h3>
      <div className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.slug} className="flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[17px] bg-soft-gray">
              <Image src={item.imagen} alt={item.nombre} fill className="object-cover" sizes="48px" />
            </div>
            <div className="flex-1 font-body text-xs text-secondary">
              <p className="font-bold">{item.nombre}</p>
              <p className="text-muted-foreground">Cantidad: {item.cantidad}</p>
            </div>
            <span className="font-body text-sm font-bold text-secondary">
              {formatPrecio(item.precio * item.cantidad)}
            </span>
          </div>
        ))}
        {bandanasRegalo.map((bandana, i) => (
          <div key={`${bandana.slug}-${i}`} className="flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[17px] bg-soft-gray">
              {bandana.imagen && (
                <Image
                  src={bandana.imagen}
                  alt={`Bandana ${bandana.nombre}`}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              )}
            </div>
            <div className="flex-1 font-body text-xs text-secondary">
              <p className="font-bold">
                Bandana {bandana.nombre} — Talla {bandana.talla}
              </p>
              <p className="text-muted-foreground">Regalo · Cantidad: 1</p>
            </div>
            <span className="font-body text-sm font-bold text-green-600">Gratis</span>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        {descuento ? (
          <div className="flex items-center justify-between rounded-sm bg-accent/10 px-3 py-2">
            <div className="flex items-center gap-2 font-body text-xs text-secondary">
              <Tag className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.75} />
              <span>
                <strong>{descuento.codigo}</strong> aplicado — {descuento.mensaje}
              </span>
            </div>
            <button
              type="button"
              aria-label="Quitar código"
              onClick={quitarCodigo}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="¿Tienes un código de descuento?"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value)}
                disabled={envio == null}
                className="w-full rounded-[17px] border border-border px-4 py-2 font-body text-sm uppercase disabled:opacity-50"
              />
              <button
                type="button"
                onClick={aplicarCodigo}
                disabled={validando || !codigoInput.trim() || envio == null}
                className="shrink-0 rounded-[17px] bg-secondary px-4 py-2 font-body text-sm font-bold text-white disabled:opacity-50"
              >
                {validando ? "..." : "Aplicar"}
              </button>
            </div>
            {envio == null && (
              <p className="font-body text-xs text-muted-foreground">
                Completa tu dirección de envío para poder aplicar un código.
              </p>
            )}
            {error && <p className="font-body text-xs text-destructive">{error}</p>}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4 font-body text-sm text-secondary">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrecio(subtotal)}</span>
        </div>
        {descuentoMonto > 0 && (
          <div className="flex justify-between text-accent">
            <span>Descuento</span>
            <span>−{formatPrecio(descuentoMonto)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Envío</span>
          <span>
            {envioMostrado == null ? "—" : envioMostrado === 0 ? "Gratis" : formatPrecio(envioMostrado)}
          </span>
        </div>
        <div className="mt-2 flex justify-between border-t border-border pt-2 font-bold">
          <span>Total</span>
          <span className="text-secondary">{formatPrecio(total)}</span>
        </div>
      </div>
    </div>
  );
}
