"use client";

import { evaluarLargo, type EstadoLargo } from "@/lib/seo-producto";
import { cn } from "@/lib/utils";

interface ContadorCaracteresProps {
  texto: string;
  min: number;
  max: number;
  /** Texto que se usará si el campo queda vacío. */
  respaldo?: string;
}

const MENSAJE: Record<EstadoLargo, (min: number, max: number) => string> = {
  vacio: () => "",
  corto: (min) => `corto — apunta a ${min} o más`,
  bien: () => "buen largo",
  largo: (_min, max) => `Google lo cortará después de ${max}`,
};

/**
 * Contador con diagnóstico en palabras. Un "58/60" a secas no le dice a nadie
 * si 58 está bien o mal; el punto es que el admin sepa qué hacer.
 */
export function ContadorCaracteres({ texto, min, max, respaldo }: ContadorCaracteresProps) {
  const largo = texto.trim().length;
  const estado = evaluarLargo(texto, min, max);

  if (estado === "vacio") {
    return (
      <p className="text-xs text-muted-foreground">
        {respaldo ? `Vacío: se usará "${recortar(respaldo)}"` : "Vacío"}
      </p>
    );
  }

  return (
    <p
      className={cn(
        "text-xs",
        estado === "bien" && "text-green-700",
        estado === "corto" && "text-muted-foreground",
        estado === "largo" && "text-orange-600"
      )}
    >
      <span className="font-medium tabular-nums">{largo}</span> de {max} caracteres ·{" "}
      {MENSAJE[estado](min, max)}
    </p>
  );
}

function recortar(texto: string): string {
  return texto.length > 60 ? `${texto.slice(0, 59)}…` : texto;
}
