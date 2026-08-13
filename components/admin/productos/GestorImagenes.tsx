"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GestorImagenesProps {
  galeria: string[];
  principal: string;
  subiendo: boolean;
  onSubir: (files: FileList) => void;
  onCambiar: (galeria: string[], principal: string) => void;
}

/**
 * Grilla de fotos del producto. A diferencia de la versión anterior (que solo
 * dejaba borrar y elegía la portada sola, tomando la primera que se subía),
 * acá el admin decide explícitamente cuál es la portada y en qué orden se ven
 * las demás en la galería de la ficha pública.
 */
export function GestorImagenes({
  galeria,
  principal,
  subiendo,
  onSubir,
  onCambiar,
}: GestorImagenesProps) {
  function hacerPortada(url: string) {
    onCambiar(galeria, url);
  }

  function quitar(url: string) {
    const restantes = galeria.filter((g) => g !== url);
    const nuevaPortada = principal === url ? restantes[0] ?? "" : principal;
    onCambiar(restantes, nuevaPortada);
  }

  function mover(url: string, direccion: -1 | 1) {
    const desde = galeria.indexOf(url);
    const hasta = desde + direccion;
    if (desde < 0 || hasta < 0 || hasta >= galeria.length) return;
    const copia = [...galeria];
    [copia[desde], copia[hasta]] = [copia[hasta], copia[desde]];
    onCambiar(copia, principal);
  }

  return (
    <div className="flex flex-col gap-3">
      {galeria.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {galeria.map((url, i) => {
            const esPortada = url === principal;
            return (
              <li
                key={url}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-md border-2 bg-soft-gray transition-colors",
                  esPortada ? "border-primary" : "border-transparent hover:border-border"
                )}
              >
                <Image src={url} alt="" fill className="object-cover" sizes="120px" />

                {esPortada && (
                  <span className="absolute left-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    Portada
                  </span>
                )}

                {/* Siempre visibles, no solo al pasar el mouse: si "hacer
                    portada" se esconde detrás de un hover, nadie lo encuentra. */}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-t from-black/75 to-transparent p-1.5 pt-6">
                  <BotonMini
                    titulo="Mover a la izquierda"
                    disabled={i === 0}
                    onClick={() => mover(url, -1)}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </BotonMini>
                  <BotonMini
                    titulo={esPortada ? "Ya es la portada" : "Usar como portada"}
                    disabled={esPortada}
                    onClick={() => hacerPortada(url)}
                  >
                    <Star className="h-3.5 w-3.5" />
                  </BotonMini>
                  <BotonMini
                    titulo="Mover a la derecha"
                    disabled={i === galeria.length - 1}
                    onClick={() => mover(url, 1)}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </BotonMini>
                  <BotonMini titulo="Quitar foto" onClick={() => quitar(url)} peligro>
                    <Trash2 className="h-3.5 w-3.5" />
                  </BotonMini>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <label
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border px-4 py-6 text-center transition-colors hover:border-primary hover:bg-primary/5",
          subiendo && "pointer-events-none opacity-60"
        )}
      >
        <ImagePlus className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">
          {subiendo ? "Subiendo fotos…" : "Subir fotos"}
        </span>
        <span className="text-xs text-muted-foreground">
          JPG, PNG o WebP. Puedes elegir varias a la vez.
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          disabled={subiendo}
          onChange={(e) => {
            if (e.target.files?.length) onSubir(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {galeria.length > 0 && (
        <p className="text-xs text-muted-foreground">
          La <strong className="font-semibold text-foreground">portada</strong> es la foto que se ve
          en el catálogo, el carrito y los correos. Las flechas cambian el orden de la galería en la
          ficha del producto.
        </p>
      )}
    </div>
  );
}

interface BotonMiniProps {
  titulo: string;
  disabled?: boolean;
  peligro?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function BotonMini({ titulo, disabled, peligro, onClick, children }: BotonMiniProps) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-md bg-white/90 text-foreground transition-colors",
        "hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
        "disabled:pointer-events-none disabled:opacity-40",
        peligro && "hover:bg-destructive hover:text-destructive-foreground"
      )}
    >
      {children}
    </button>
  );
}
