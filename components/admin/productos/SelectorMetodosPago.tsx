"use client";

import { Banknote, Check, CreditCard, Landmark, Smartphone } from "lucide-react";
import {
  METODO_PAGO_LABEL,
  TODOS_LOS_METODOS_PAGO,
  type MetodoPago,
} from "@/lib/data/productos-shared";
import { cn } from "@/lib/utils";

/**
 * Ícono + explicación de qué implica cada método para el cliente. Sin esto la
 * pantalla eran cuatro checkboxes con nombres técnicos: el admin no tenía cómo
 * saber, por ejemplo, que "contra entrega" no se le ofrece a cualquiera.
 */
const DETALLE: Record<
  MetodoPago,
  { icono: typeof CreditCard; descripcion: string }
> = {
  tarjeta: {
    icono: CreditCard,
    descripcion: "Visa, Mastercard y otras vía Mercado Pago. El pedido llega ya pagado.",
  },
  yape_plin: {
    icono: Smartphone,
    descripcion: "El cliente yapea y sube su captura. Tú confirmas el pago desde Pedidos.",
  },
  transferencia: {
    icono: Landmark,
    descripcion: "Depósito o transferencia bancaria con comprobante adjunto.",
  },
  contra_entrega: {
    icono: Banknote,
    descripcion:
      "Paga al motorizado al recibir. Solo se le ofrece a clientes con 2 pedidos entregados o más.",
  },
};

interface SelectorMetodosPagoProps {
  seleccionados: MetodoPago[];
  onToggle: (id: MetodoPago) => void;
}

export function SelectorMetodosPago({ seleccionados, onToggle }: SelectorMetodosPagoProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {TODOS_LOS_METODOS_PAGO.map((id) => {
        const { icono: Icono, descripcion } = DETALLE[id];
        const activo = seleccionados.includes(id);
        return (
          <button
            key={id}
            type="button"
            role="checkbox"
            aria-checked={activo}
            onClick={() => onToggle(id)}
            className={cn(
              "flex items-start gap-3 rounded-md border-2 p-3 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              activo
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-muted-foreground/40"
            )}
          >
            <span
              className={cn(
                "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md transition-colors",
                activo ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              <Icono className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                {METODO_PAGO_LABEL[id]}
                {activo && <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} />}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                {descripcion}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Fila compacta de íconos para la tabla del listado. */
export function IconosMetodosPago({ metodos }: { metodos: MetodoPago[] }) {
  if (!metodos?.length) {
    return <span className="text-xs text-muted-foreground">Ninguno</span>;
  }
  return (
    <div className="flex items-center gap-1">
      {TODOS_LOS_METODOS_PAGO.filter((id) => metodos.includes(id)).map((id) => {
        const { icono: Icono } = DETALLE[id];
        return (
          <span
            key={id}
            title={METODO_PAGO_LABEL[id]}
            className="grid h-6 w-6 place-items-center rounded-md bg-muted text-muted-foreground"
          >
            <Icono className="h-3.5 w-3.5" />
            <span className="sr-only">{METODO_PAGO_LABEL[id]}</span>
          </span>
        );
      })}
    </div>
  );
}
