"use client";

import Image from "next/image";
import { AlertCircle, CheckCircle2, ImageOff } from "lucide-react";
import { formatPrecio } from "@/lib/data/productos-shared";
import { cn } from "@/lib/utils";

export interface RequisitoPublicacion {
  ok: boolean;
  texto: string;
}

interface VistaPreviaProductoProps {
  nombre: string;
  slug: string;
  imagen: string;
  precio: number;
  precioComparacion: number;
  descuento: number;
  categoria: "producto" | "combo";
  activo: boolean;
  requisitos: RequisitoPublicacion[];
}

/**
 * Réplica de la tarjeta de catálogo (components/productos/ProductCard.tsx) para
 * que el admin vea el resultado mientras escribe, en vez de guardar y salir a
 * la tienda a comprobar cómo quedó.
 */
export function VistaPreviaProducto({
  nombre,
  slug,
  imagen,
  precio,
  precioComparacion,
  descuento,
  categoria,
  activo,
  requisitos,
}: VistaPreviaProductoProps) {
  const pendientes = requisitos.filter((r) => !r.ok);

  return (
    <aside className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Así se verá en la tienda
        </p>

        <div className="mt-2 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="relative aspect-square bg-soft-gray">
            {imagen ? (
              <Image src={imagen} alt="" fill className="object-cover" sizes="280px" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageOff className="h-6 w-6" />
                <span className="text-xs">Sin foto de portada</span>
              </div>
            )}
            {descuento > 0 && (
              <span className="absolute left-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-destructive-foreground">
                -{descuento}%
              </span>
            )}
            {!activo && (
              <span className="absolute inset-0 grid place-items-center bg-background/80 text-sm font-semibold text-muted-foreground">
                Oculto en la tienda
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {categoria === "combo" ? "Combo" : "Producto"}
            </span>
            <p className="line-clamp-2 text-sm font-semibold leading-snug">
              {nombre || "Nombre del producto"}
            </p>
            <p className="flex items-baseline gap-2">
              <span className="text-lg font-bold tabular-nums">{formatPrecio(precio || 0)}</span>
              {precioComparacion > precio && (
                <span className="text-sm text-muted-foreground line-through tabular-nums">
                  {formatPrecio(precioComparacion)}
                </span>
              )}
            </p>
          </div>
        </div>

        <p className="mt-2 break-all text-xs text-muted-foreground">
          suplevet.pe/productos/<span className="font-medium text-foreground">{slug || "…"}</span>
        </p>
      </div>

      <div className="rounded-md border bg-muted/40 p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold">
          {pendientes.length === 0 ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              Listo para publicar
            </>
          ) : (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
              Falta {pendientes.length} {pendientes.length === 1 ? "cosa" : "cosas"}
            </>
          )}
        </p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {requisitos.map((r) => (
            <li
              key={r.texto}
              className={cn(
                "flex items-start gap-1.5 text-xs",
                r.ok ? "text-muted-foreground" : "font-medium text-foreground"
              )}
            >
              {r.ok ? (
                <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0 text-green-600" />
              ) : (
                <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0 text-orange-500" />
              )}
              {r.texto}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
