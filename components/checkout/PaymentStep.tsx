"use client";

import { useState } from "react";
import { CreditCard, Smartphone, Landmark } from "lucide-react";

export type MetodoPago = "tarjeta" | "yape_plin" | "transferencia";

interface PaymentStepProps {
  onConfirmar: (metodo: MetodoPago) => void;
  procesando: boolean;
}

const metodos: { id: MetodoPago; label: string; icon: typeof CreditCard }[] = [
  { id: "tarjeta", label: "Tarjeta", icon: CreditCard },
  { id: "yape_plin", label: "Yape / Plin", icon: Smartphone },
  { id: "transferencia", label: "Transferencia bancaria", icon: Landmark },
];

export function PaymentStep({ onConfirmar, procesando }: PaymentStepProps) {
  const [seleccionado, setSeleccionado] = useState<MetodoPago | null>(null);

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-secondary">Método de pago</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {metodos.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSeleccionado(id)}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-6 transition-colors ${
              seleccionado === id ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <Icon className="h-8 w-8 text-secondary" strokeWidth={1.5} />
            <span className="font-body text-sm font-bold text-secondary">{label}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={!seleccionado || procesando}
        onClick={() => seleccionado && onConfirmar(seleccionado)}
        className="mt-6 w-full rounded-full bg-primary px-6 py-3 font-body font-bold text-primary-foreground disabled:opacity-50 sm:w-fit"
      >
        {procesando ? "Procesando…" : "Confirmar pedido"}
      </button>
    </div>
  );
}
