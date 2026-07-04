"use client";

import { useState } from "react";
import { ingredientes } from "@/lib/data/productos-shared";

export function IngredientesSection() {
  const [activo, setActivo] = useState(0);
  const ingrediente = ingredientes[activo];

  return (
    <section className="bg-soft-gray py-section-y">
      <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
        <h2 className="text-center font-display text-2xl font-bold text-secondary md:text-3xl">
          Ingredientes de alta calidad
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center font-body text-sm text-muted-foreground">
          Una fórmula sinérgica desarrollada para veterinarios. Cada ingrediente cumple una función
          específica para proteger y revitalizar a tu mascota.
        </p>

        <div className="mx-auto mt-8 flex max-w-xl flex-wrap justify-center gap-2">
          {ingredientes.map((ing, i) => (
            <button
              key={ing.nombre}
              type="button"
              onClick={() => setActivo(i)}
              className={`rounded-full border px-4 py-2 font-body text-sm font-bold transition-colors ${
                activo === i
                  ? "border-secondary bg-secondary text-white"
                  : "border-border bg-white text-secondary"
              }`}
            >
              {ing.nombre}
            </button>
          ))}
        </div>

        <div className="mx-auto mt-6 max-w-xl rounded-xl bg-white p-6 shadow-sm">
          <h3 className="font-display text-lg font-bold text-secondary">{ingrediente.nombre}</h3>
          <p className="mt-2 font-body text-sm text-muted-foreground">
            {ingrediente.descripcionCorta}
          </p>
        </div>
      </div>
    </section>
  );
}
