"use client";

import { useState } from "react";
import { ProductCard } from "@/components/productos/ProductCard";
import type { CategoriaProducto, ProductoCombo } from "@/lib/data/productos-shared";

const filtros: { label: string; value: CategoriaProducto | "todos" }[] = [
  { label: "Todos", value: "todos" },
  { label: "Individuales", value: "producto" },
  { label: "Combos", value: "combo" },
];

interface CatalogoGridProps {
  productos: ProductoCombo[];
}

export function CatalogoGrid({ productos }: CatalogoGridProps) {
  const [filtro, setFiltro] = useState<CategoriaProducto | "todos">("todos");

  const visibles =
    filtro === "todos" ? productos : productos.filter((p) => p.categoria === filtro);

  return (
    <div>
      <div className="mx-auto flex w-fit gap-1 rounded-full bg-soft-gray p-1">
        {filtros.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFiltro(f.value)}
            className={`rounded-full px-5 py-2 font-body text-sm font-bold transition-colors ${
              filtro === f.value
                ? "bg-white text-secondary shadow-sm"
                : "text-muted-foreground hover:text-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {visibles.map((producto) => (
          <ProductCard key={producto.slug} producto={producto} />
        ))}
      </div>
    </div>
  );
}
