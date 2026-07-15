"use client";

import { useState } from "react";
import type { IngredienteProducto } from "@/lib/ingredientes";
import { ScrollReveal } from "@/components/shared/ScrollReveal";

interface IngredientesSectionProps {
  ingredientes: IngredienteProducto[];
}

export function IngredientesSection({ ingredientes }: IngredientesSectionProps) {
  const [activo, setActivo] = useState(0);
  const ingrediente = ingredientes[activo];

  if (!ingrediente) return null;

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

        {/* Mobile: pills en fila (wrap) arriba, tarjeta de descripción debajo
            — se queda igual, ya funcionaba bien. Desde md: dos columnas, los
            componentes apilados en una columna angosta a la izquierda y la
            tarjeta de descripción ocupando el resto a la derecha. */}
        <div className="mx-auto mt-8 flex max-w-xl flex-col gap-6 md:max-w-3xl md:flex-row md:items-start md:gap-8">
          <div className="flex flex-wrap justify-center gap-2 md:w-56 md:shrink-0 md:flex-col md:flex-nowrap md:justify-start">
            {ingredientes.map((ing, i) => (
              <button
                key={ing.id}
                type="button"
                onClick={() => setActivo(i)}
                className={`rounded-full border px-4 py-2 font-body text-sm font-bold transition-colors md:text-left ${
                  activo === i
                    ? "border-secondary bg-secondary text-white"
                    : "border-border bg-white text-secondary"
                }`}
              >
                {ing.nombre}
              </button>
            ))}
          </div>

          <ScrollReveal
            key={ingrediente.nombre}
            className="rounded-sm bg-white p-6 shadow-sm md:flex-1"
          >
            <h3 className="font-display text-lg font-bold text-secondary">{ingrediente.titulo}</h3>
            <ul className="mt-3 flex flex-col gap-2.5">
              {ingrediente.beneficios.map((beneficio) => (
                <li key={beneficio} className="flex gap-2 font-body text-sm text-muted-foreground">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                  {beneficio}
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
