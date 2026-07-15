"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { provinciasPorDepartamento, distritosPorProvincia } from "@/lib/data/ubigeo";
import {
  departamentosCheckout,
  getZonasEnvioActivas,
  encontrarZonaPorDepartamento,
  calcularCostoEnvio,
  type EnvioZona,
} from "@/lib/shipping";
import { formatPrecio } from "@/lib/data/productos-shared";

export type MetodoEnvio = "motorizado" | "shalom";

export interface DireccionEnvio {
  nombre: string;
  apellidos: string;
  direccion: string;
  direccionSecundaria: string;
  departamento: string;
  provincia: string;
  distrito: string;
  codigoPostal: string;
  telefono: string;
  metodoEnvio: MetodoEnvio | "";
}

export const direccionVacia: DireccionEnvio = {
  nombre: "",
  apellidos: "",
  direccion: "",
  direccionSecundaria: "",
  departamento: "",
  provincia: "",
  distrito: "",
  codigoPostal: "",
  telefono: "",
  metodoEnvio: "",
};

interface ShippingStepProps {
  subtotal: number;
  value: DireccionEnvio;
  onChange: (direccion: DireccionEnvio) => void;
  onZonaChange: (zona: EnvioZona | undefined, costoEnvio: number | null) => void;
}

const inputClass =
  "rounded-md border border-border px-4 py-3 font-body text-sm text-secondary placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed";

const metodosEnvio: { value: MetodoEnvio; nombre: string; descripcion: string }[] = [
  { value: "motorizado", nombre: "Delivery motorizado", descripcion: "Entrega directa en tu domicilio." },
  { value: "shalom", nombre: "Agencia Shalom", descripcion: "Envío y recojo en la agencia Shalom más cercana." },
];

// Renderiza dirección + método de envío como secciones de un único formulario
// continuo (no un "paso" aparte) — así el checkout completo vive en una sola
// página, igual al patrón de Shopify que pediste en vez del wizard por pasos.
export function ShippingStep({ subtotal, value, onChange, onZonaChange }: ShippingStepProps) {
  const [zonas, setZonas] = useState<EnvioZona[]>([]);

  useEffect(() => {
    getZonasEnvioActivas(createClient()).then(setZonas);
  }, []);

  // Ciudad = provincia (dropdown siempre, con datos reales de RENIEC para los
  // 26 departamentos/zonas — antes solo Lima Metropolitana/Callao tenían
  // dropdown real y el resto era un input de texto deshabilitado hasta elegir
  // región, lo cual confundía el orden: ahora Región siempre va primero y
  // Ciudad/Distrito dependen de ella, pero los 3 son siempre <select>.
  const provincias = provinciasPorDepartamento[value.departamento] ?? [];
  const distritos = value.provincia
    ? distritosPorProvincia[`${value.departamento}::${value.provincia}`] ?? []
    : [];

  const zona = value.departamento ? encontrarZonaPorDepartamento(zonas, value.departamento) : undefined;
  const costoEnvio = zona ? calcularCostoEnvio(zona, subtotal) : null;

  useEffect(() => {
    onZonaChange(zona, costoEnvio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zona?.id, costoEnvio]);

  function set<K extends keyof DireccionEnvio>(campo: K, valor: DireccionEnvio[K]) {
    onChange({ ...value, [campo]: valor });
  }

  function setDepartamento(nuevoDepartamento: string) {
    const nuevasProvincias = provinciasPorDepartamento[nuevoDepartamento] ?? [];
    // Si solo hay una provincia real (caso Lima Metropolitana / Callao), se
    // autoselecciona para no pedirle un clic de más a la persona.
    const provinciaAuto = nuevasProvincias.length === 1 ? nuevasProvincias[0] : "";
    onChange({ ...value, departamento: nuevoDepartamento, provincia: provinciaAuto, distrito: "" });
  }

  function setProvincia(nuevaProvincia: string) {
    onChange({ ...value, provincia: nuevaProvincia, distrito: "" });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-secondary">Entrega y facturación</h2>
          <p className="font-body text-xs text-muted-foreground">
            Ya tenemos tu cuenta registrada — confirma o ajusta estos datos para tu envío y comprobante.
          </p>
        </div>

        <select disabled className={`${inputClass} bg-soft-gray text-muted-foreground`} defaultValue="Perú">
          <option>Perú</option>
        </select>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input
            required
            type="text"
            placeholder="Nombre"
            value={value.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            className={inputClass}
          />
          <input
            required
            type="text"
            placeholder="Apellidos"
            value={value.apellidos}
            onChange={(e) => set("apellidos", e.target.value)}
            className={inputClass}
          />
        </div>

        <input
          required
          type="text"
          placeholder="Dirección"
          value={value.direccion}
          onChange={(e) => set("direccion", e.target.value)}
          className={inputClass}
        />

        <input
          type="text"
          placeholder="Casa, apartamento, etc. (opcional)"
          value={value.direccionSecundaria}
          onChange={(e) => set("direccionSecundaria", e.target.value)}
          className={inputClass}
        />

        {/* Orden lógico: Región primero (de ella depende Ciudad), luego Ciudad
            (de ella depende Distrito), luego Distrito, y por último el código
            postal opcional. Los 3 primeros son SIEMPRE listas desplegables. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <select
            required
            value={value.departamento}
            onChange={(e) => setDepartamento(e.target.value)}
            className={inputClass}
          >
            <option value="">Región</option>
            {departamentosCheckout.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            required
            value={value.provincia}
            disabled={provincias.length === 0}
            onChange={(e) => setProvincia(e.target.value)}
            className={inputClass}
          >
            <option value="">Ciudad</option>
            {provincias.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            required
            value={value.distrito}
            disabled={distritos.length === 0}
            onChange={(e) => set("distrito", e.target.value)}
            className={inputClass}
          >
            <option value="">Distrito</option>
            {distritos.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Código postal (opcional)"
            value={value.codigoPostal}
            onChange={(e) => set("codigoPostal", e.target.value)}
            className={inputClass}
          />
        </div>

        <input
          required
          type="tel"
          placeholder="Teléfono"
          value={value.telefono}
          onChange={(e) => set("telefono", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold text-secondary">Métodos de envío</h2>
        {!value.departamento ? (
          <p className="rounded-md bg-soft-gray p-4 font-body text-sm text-muted-foreground">
            Completa tu región para ver las opciones de envío.
          </p>
        ) : zona && costoEnvio !== null ? (
          <div className="flex flex-col gap-2">
            {metodosEnvio.map((metodo) => {
              const seleccionado = value.metodoEnvio === metodo.value;
              return (
                <button
                  key={metodo.value}
                  type="button"
                  onClick={() => set("metodoEnvio", metodo.value)}
                  className={`flex items-center justify-between gap-3 rounded-md border-2 p-4 text-left transition-colors ${
                    seleccionado ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        seleccionado ? "border-primary bg-primary" : "border-border"
                      }`}
                    >
                      {seleccionado && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
                    </span>
                    <div>
                      <p className="font-body text-sm font-bold text-secondary">
                        {metodo.nombre} — {zona.tiempo_estimado}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">{metodo.descripcion}</p>
                    </div>
                  </div>
                  <span className="shrink-0 font-body text-sm font-bold text-secondary">
                    {costoEnvio === 0 ? "GRATIS" : formatPrecio(costoEnvio)}
                  </span>
                </button>
              );
            })}
            <p className="font-body text-xs text-muted-foreground">
              Recuerda: compras mayores a {formatPrecio(zona.monto_minimo_gratis)} tienen delivery GRATIS.
            </p>
          </div>
        ) : (
          <p className="rounded-md bg-soft-gray p-4 font-body text-sm text-muted-foreground">
            No tenemos tarifa de envío configurada para esta región todavía.
          </p>
        )}
      </div>
    </div>
  );
}
