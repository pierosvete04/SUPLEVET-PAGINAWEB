"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { distritosPorDepartamento } from "@/lib/data/ubigeo-temp";
import {
  departamentosCheckout,
  getZonasEnvioActivas,
  encontrarZonaPorDepartamento,
  calcularCostoEnvio,
  type EnvioZona,
} from "@/lib/shipping";
import { formatPrecio } from "@/lib/data/productos-shared";
import { ShippingProgressBar } from "@/components/shared/ShippingProgressBar";

export interface DireccionEnvio {
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
}

interface ShippingStepProps {
  subtotal: number;
  onContinuar: (direccion: DireccionEnvio, costoEnvio: number) => void;
}

export function ShippingStep({ subtotal, onContinuar }: ShippingStepProps) {
  const [zonas, setZonas] = useState<EnvioZona[]>([]);
  const [departamento, setDepartamento] = useState("");
  const [provincia, setProvincia] = useState("");
  const [distrito, setDistrito] = useState("");
  const [direccion, setDireccion] = useState("");

  useEffect(() => {
    getZonasEnvioActivas(createClient()).then(setZonas);
  }, []);

  const distritos = distritosPorDepartamento[departamento] ?? [];
  const tieneDistritosReales = distritos.length > 0;
  const zona = departamento ? encontrarZonaPorDepartamento(zonas, departamento) : undefined;
  const costoEnvio = zona ? calcularCostoEnvio(zona, subtotal) : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!departamento || !provincia || !direccion || costoEnvio === null) return;
    onContinuar({ departamento, provincia, distrito: distrito || provincia, direccion }, costoEnvio);
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="flex flex-col gap-4 md:col-span-2">
        <h2 className="font-display text-xl font-bold text-secondary">Dirección de envío</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            {departamentosCheckout.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {tieneDistritosReales ? (
            <select
              required
              value={distrito}
              onChange={(e) => {
                setDistrito(e.target.value);
                setProvincia(e.target.value);
              }}
              className="rounded-lg border border-border px-4 py-3 font-body text-sm text-secondary"
            >
              <option value="">Distrito</option>
              {distritos.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          ) : (
            <input
              required
              type="text"
              placeholder="Provincia / Distrito"
              value={provincia}
              disabled={!departamento}
              onChange={(e) => setProvincia(e.target.value)}
              className="rounded-lg border border-border px-4 py-3 font-body text-sm text-secondary disabled:opacity-50"
            />
          )}
        </div>

        <input
          required
          type="text"
          placeholder="Dirección (calle, número, referencia)"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          className="rounded-lg border border-border px-4 py-3 font-body text-sm text-secondary"
        />

        {zona && costoEnvio !== null && (
          <div className="rounded-lg bg-soft-gray p-4 font-body text-sm text-secondary">
            Envío a {zona.nombre} ({zona.tiempo_estimado}):{" "}
            {costoEnvio === 0 ? "GRATIS 🎉" : formatPrecio(costoEnvio)}
          </div>
        )}

        <button
          type="submit"
          disabled={!zona}
          className="mt-2 w-fit rounded-full bg-primary px-6 py-3 font-body font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          Continuar al pago
        </button>
      </div>

      <div>
        <ShippingProgressBar subtotal={subtotal} zona={zona} />
      </div>
    </form>
  );
}
