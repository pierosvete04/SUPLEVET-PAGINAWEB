"use client";

import { siteConfig } from "@/lib/site-config";
import { LARGO_META } from "@/lib/seo-producto";

interface VistaPreviaGoogleProps {
  titulo: string;
  descripcion: string;
  slug: string;
}

/**
 * Maqueta del resultado de búsqueda. Los colores son los de Google a propósito
 * (no tokens de marca): el punto es que el admin reconozca la pantalla y
 * entienda que está escribiendo para ese espacio, no para la ficha.
 */
export function VistaPreviaGoogle({ titulo, descripcion, slug }: VistaPreviaGoogleProps) {
  const tituloCortado = recortar(titulo, LARGO_META.tituloMax);
  const descripcionCortada = recortar(descripcion, LARGO_META.descripcionMax);

  return (
    <div className="rounded-md border bg-white p-4">
      <p className="text-xs text-[#4d5156]">
        {siteConfig.siteUrl.replace("https://", "")} › productos › {slug || "…"}
      </p>
      <p className="mt-0.5 text-lg leading-snug text-[#1a0dab]">
        {tituloCortado || "Título del producto"}
      </p>
      <p className="mt-0.5 text-sm leading-snug text-[#4d5156]">
        {descripcionCortada || "Acá va la descripción que Google muestra bajo el título."}
      </p>
    </div>
  );
}

/** Google corta con "…" lo que pasa del ancho que muestra. */
function recortar(texto: string, max: number): string {
  const limpio = texto.trim();
  return limpio.length > max ? `${limpio.slice(0, max - 1).trimEnd()}…` : limpio;
}
