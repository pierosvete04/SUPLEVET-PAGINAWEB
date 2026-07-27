"use client";

import { useEffect, useRef, useState } from "react";

interface BreedComboboxProps {
  id?: string;
  value: string;
  onChange: (valor: string) => void;
  opciones: string[];
  placeholder?: string;
  className?: string;
}

const OPCION_OTRA = "Otro";

// Reemplaza el <input list> + <datalist> nativo: el navegador decide dónde
// y cómo pintar un datalist (a veces se abre hacia arriba o cubre la pantalla),
// mientras que este dropdown vive dentro de un contenedor `relative` propio,
// así que siempre se despliega justo debajo del campo. También siempre incluye
// la opción "Otro" para mascotas sin raza definida.
export function BreedCombobox({ id, value, onChange, opciones, placeholder, className }: BreedComboboxProps) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function alClicFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", alClicFuera);
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, []);

  const filtro = value.trim().toLowerCase();
  const filtradas = filtro ? opciones.filter((o) => o.toLowerCase().includes(filtro)) : opciones;
  const mostrarOtra = !filtro || OPCION_OTRA.toLowerCase().includes(filtro);

  function elegir(opcion: string) {
    onChange(opcion);
    setAbierto(false);
  }

  return (
    <div ref={contenedorRef} className="relative">
      <input
        id={id}
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setAbierto(false);
        }}
        placeholder={placeholder}
        className={className}
      />
      {abierto && (filtradas.length > 0 || mostrarOtra) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-2xl border border-portal-surface-variant bg-white py-1 shadow-lg">
          {filtradas.map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => elegir(opcion)}
              className="block w-full px-4 py-2 text-left text-sm font-medium text-portal-navy hover:bg-portal-surface-low/60"
            >
              {opcion}
            </button>
          ))}
          {mostrarOtra && (
            <button
              type="button"
              onClick={() => elegir(OPCION_OTRA)}
              className="block w-full border-t border-portal-surface-variant px-4 py-2 text-left text-sm font-semibold text-portal-muted hover:bg-portal-surface-low/60"
            >
              Otro (sin raza definida)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
