"use client";

import { useState } from "react";
import {
  departamentos,
  provinciasPorDepartamento,
  distritosPorProvincia,
  esLimaMetropolitana,
} from "@/lib/data/ubigeo-temp";
import { formatPrecio } from "@/lib/data/productos-temp";
import { ShippingProgressBar } from "@/components/shared/ShippingProgressBar";

export interface DireccionEnvio {
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
}

interface ShippingStepProps {
  subtotal: number;
  onContinuar: (direccion: DireccionEnvio) => void;
}

export function ShippingStep({ subtotal, onContinuar }: ShippingStepProps) {
  const [departamento, setDepartamento] = useState("");
  const [provincia, setProvincia] = useState("");
  const [distrito, setDistrito] = useState("");
  const [direccion, setDireccion] = useState("");

  const provincias = provinciasPorDepartamento[departamento] ?? [];
  const distritos = distritosPorProvincia[provincia] ?? [];
  const esLima = esLimaMetropolitana(departamento, provincia);

  let costoEnvio: number | null = null;
  if (departamento && provincia) {
    costoEnvio = esLima ? (subtotal >= 150 ? 0 : 15) : subtotal >= 350 ? 0 : 25;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!departamento || !provincia || !distrito || !direccion) return;
    onContinuar({ departamento, provincia, distrito, direccion });
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="flex flex-col gap-4 md:col-span-2">
        <h2 className="font-display text-xl font-bold text-secondary">Dirección de envío</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <select
            required
            value={departamento}
            onChange={(e) => {
              setDepartamento(e.target.value);
              setProvincia("");
              setDistrito("");
            }}
            className="rounded-lg border border-border px-4 py-3 font-body text-sm text-secondary"
          >
            <option value="">Departamento</option>
            {departamentos.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            required
            value={provincia}
            disabled={!departamento || departamento === "Otro"}
            onChange={(e) => {
              setProvincia(e.target.value);
              setDistrito("");
            }}
            className="rounded-lg border border-border px-4 py-3 font-body text-sm text-secondary disabled:opacity-50"
          >
            <option value="">Provincia</option>
            {provincias.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            required
            value={distrito}
            disabled={!provincia}
            onChange={(e) => setDistrito(e.target.value)}
            className="rounded-lg border border-border px-4 py-3 font-body text-sm text-secondary disabled:opacity-50"
          >
            <option value="">Distrito</option>
            {distritos.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {departamento === "Otro" && (
          <p className="font-body text-xs text-muted-foreground">
            Cobertura nacional confirmada — el listado completo de provincias/distritos está
            pendiente de cargar (ver PLAN.md sección 9). Por ahora contáctanos por WhatsApp para
            coordinar el envío a tu zona.
          </p>
        )}

        <input
          required
          type="text"
          placeholder="Dirección (calle, número, referencia)"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          className="rounded-lg border border-border px-4 py-3 font-body text-sm text-secondary"
        />

        {costoEnvio !== null && (
          <div className="rounded-lg bg-soft-gray p-4 font-body text-sm text-secondary">
            Envío a {distrito || provincia}: {costoEnvio === 0 ? "GRATIS 🎉" : formatPrecio(costoEnvio)}
          </div>
        )}

        <button
          type="submit"
          className="mt-2 w-fit rounded-full bg-primary px-6 py-3 font-body font-bold text-primary-foreground hover:opacity-90"
        >
          Continuar al pago
        </button>
      </div>

      <div>
        <ShippingProgressBar subtotal={subtotal} />
      </div>
    </form>
  );
}
