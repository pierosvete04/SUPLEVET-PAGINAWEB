"use client";

import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";

const LARGO = 6;

interface CodigoOtpInputProps {
  value: string;
  onChange: (codigo: string) => void;
  disabled?: boolean;
}

// Un solo <input> real cubriendo las 6 casillas, que solo son decoración.
// La versión anterior eran 6 inputs con maxLength={1}: pegar el código del
// correo dejaba un único dígito (el navegador trunca el pegado al maxLength) y
// el autocompletado de "código de un solo uso" del sistema tampoco entraba.
// Con un input único, pegar, escribir y el autofill funcionan sin código extra.
export const CodigoOtpInput = forwardRef<HTMLInputElement, CodigoOtpInputProps>(
  function CodigoOtpInput({ value, onChange, disabled }, ref) {
    const [enfocado, setEnfocado] = useState(false);
    const digitos = value.split("");
    const posicionActiva = Math.min(value.length, LARGO - 1);

    return (
      <div className="relative">
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          aria-label="Código de 6 dígitos"
          maxLength={LARGO}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, LARGO))}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer text-center font-body text-transparent opacity-0"
        />
        <div className="flex justify-center gap-2" aria-hidden="true">
          {Array.from({ length: LARGO }).map((_, i) => {
            const activa = enfocado && i === posicionActiva && value.length < LARGO;
            return (
              <div
                key={i}
                className={cn(
                  "flex h-12 w-10 items-center justify-center rounded-lg border border-border font-body text-lg font-bold text-secondary transition-colors",
                  activa && "border-primary ring-1 ring-primary",
                  enfocado && value.length === LARGO && "border-primary"
                )}
              >
                {digitos[i] ?? ""}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
