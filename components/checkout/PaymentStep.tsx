"use client";

import { useState } from "react";
import Image from "next/image";
import { CreditCard, Smartphone, Landmark, Banknote, Copy, Check } from "lucide-react";
import { formatPrecio, METODO_PAGO_LABEL, type MetodoPago } from "@/lib/data/productos-shared";

export type { MetodoPago };

interface PaymentStepProps {
  metodo: MetodoPago | null;
  onChange: (metodo: MetodoPago) => void;
  /** Intersección de métodos admitidos por todos los productos del carrito
   * (ver app/checkout/page.tsx) — un combo restringido a Yape/transferencia
   * oculta la opción de tarjeta aunque el resto del catálogo sí la admita. */
  metodosPermitidos: MetodoPago[];
  /** Total del pedido (con envío y descuento). Solo se usa para decirle al
   * cliente cuánto tener listo si elige pago contra entrega. */
  totalACobrar?: number | null;
  /** Explicación de por qué faltan métodos (carrito restringido, contra
   * entrega sin cupo logístico, etc.) — la calcula el checkout, que es quien
   * sabe el motivo real de cada exclusión. */
  notaMetodos?: string | null;
}

const metodos: { id: MetodoPago; label: string; icon: typeof CreditCard }[] = [
  { id: "tarjeta", label: METODO_PAGO_LABEL.tarjeta, icon: CreditCard },
  { id: "transferencia", label: METODO_PAGO_LABEL.transferencia, icon: Landmark },
  { id: "yape_plin", label: METODO_PAGO_LABEL.yape_plin, icon: Smartphone },
  { id: "contra_entrega", label: METODO_PAGO_LABEL.contra_entrega, icon: Banknote },
];

const DATOS_TRANSFERENCIA = {
  titular: "Nutrova For Pets",
  banco: "Interbank",
  cuenta: "200-3006830577",
  cci: "003-200-003006830577-37",
};

const DATOS_YAPE_PLIN = {
  numero: "943 116 820",
  titular: "Piero Paolo Svete Anchante",
};

const WHATSAPP_COMPROBANTES = "51920723721";
const CORREO_COMPROBANTES = "suplevetperu@gmail.com";

function CopyField({ label, value }: { label: string; value: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(value);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // Clipboard no disponible (ej. contexto no seguro) — el valor sigue visible para copiar a mano.
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-soft-gray px-4 py-2.5">
      <div>
        <p className="font-body text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-body text-sm font-bold text-secondary">{value}</p>
      </div>
      <button
        type="button"
        onClick={copiar}
        className="flex shrink-0 items-center gap-1 rounded-[17px] border border-border bg-white px-3 py-1.5 font-body text-xs font-bold text-secondary hover:bg-soft-gray"
      >
        {copiado ? (
          <>
            <Check className="h-3.5 w-3.5 text-green-600" /> Copiado
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" /> Copiar
          </>
        )}
      </button>
    </div>
  );
}

export function PaymentStep({
  metodo,
  onChange,
  metodosPermitidos,
  totalACobrar,
  notaMetodos,
}: PaymentStepProps) {
  const metodosVisibles = metodos.filter(({ id }) => metodosPermitidos.includes(id));

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-secondary">Pago</h2>
      <p className="mt-1 font-body text-xs text-muted-foreground">
        Todas las transacciones son seguras y están encriptadas.
      </p>
      {notaMetodos && (
        <p className="mt-2 font-body text-xs text-muted-foreground">{notaMetodos}</p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {metodosVisibles.map(({ id, label, icon: Icon }) => (
          <div
            key={id}
            className={`overflow-hidden rounded-md border-2 transition-colors ${
              metodo === id ? "border-primary" : "border-border"
            }`}
          >
            <button
              type="button"
              onClick={() => onChange(id)}
              className={`flex w-full items-center gap-3 px-4 py-3.5 ${
                metodo === id ? "bg-primary/5" : ""
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  metodo === id ? "border-primary" : "border-border"
                }`}
              >
                {metodo === id && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </span>
              <Icon className="h-5 w-5 text-secondary" strokeWidth={1.5} />
              <span className="font-body text-sm font-bold text-secondary">{label}</span>
            </button>

            {metodo === id && (
              <div className="border-t border-border bg-white px-4 py-4 font-body text-sm text-secondary">
                {id === "tarjeta" && <p>Se te redirigirá a Mercado Pago para que completes la compra.</p>}

                {id === "contra_entrega" && (
                  <div className="flex flex-col gap-3">
                    <p className="text-muted-foreground">
                      Pagas al motorizado en el momento de la entrega, cuando ya tienes el pedido en
                      la mano. Disponible solo para delivery en Lima Metropolitana y Callao.
                    </p>

                    {typeof totalACobrar === "number" && (
                      <div className="rounded-md bg-soft-gray px-4 py-3">
                        <p className="font-body text-[11px] uppercase tracking-wide text-muted-foreground">
                          Ten listo al recibir
                        </p>
                        <p className="font-body text-lg font-bold text-secondary">
                          {formatPrecio(totalACobrar)}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      El motorizado acepta efectivo y también Yape/Plin en la puerta. Te
                      recomendamos tener el monto exacto para agilizar la entrega.
                    </p>
                  </div>
                )}

                {id === "transferencia" && (
                  <div className="flex flex-col gap-3">
                    <p className="font-bold">1. Hacer el depósito o transferencia a nombre de:</p>
                    <CopyField label="Titular" value={DATOS_TRANSFERENCIA.titular} />
                    <CopyField label="Banco" value={DATOS_TRANSFERENCIA.banco} />
                    <CopyField label="Cuenta corriente (S/.)" value={DATOS_TRANSFERENCIA.cuenta} />
                    <CopyField label="CCI" value={DATOS_TRANSFERENCIA.cci} />

                    <p className="mt-2 font-bold">2. Envía tu comprobante</p>
                    <p className="text-muted-foreground">
                      Envía el voucher por WhatsApp al{" "}
                      <a
                        href={`https://wa.me/${WHATSAPP_COMPROBANTES}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-secondary underline"
                      >
                        +{WHATSAPP_COMPROBANTES.replace(/^51/, "51 ")}
                      </a>{" "}
                      o al correo{" "}
                      <a href={`mailto:${CORREO_COMPROBANTES}`} className="font-bold text-secondary underline">
                        {CORREO_COMPROBANTES}
                      </a>
                      .
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Nuestro equipo validará tu pago y confirmará tu pedido. Nos contactaremos contigo
                      luego de validar el pago.
                    </p>
                  </div>
                )}

                {id === "yape_plin" && (
                  <div className="flex flex-col gap-3">
                    <p className="text-muted-foreground">
                      Puedes realizar tu pago de forma rápida y segura mediante Yape o Plin.
                    </p>

                    <p className="font-bold">1. Realiza el pago</p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex flex-1 flex-col gap-3">
                        <CopyField label="Yapea o plinea al número" value={DATOS_YAPE_PLIN.numero} />
                        <CopyField label="Titular" value={DATOS_YAPE_PLIN.titular} />
                      </div>
                      <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-md border border-border bg-white">
                        <Image src="/pago/yape-qr.png" alt="Código QR de Yape" fill className="object-contain p-1" sizes="160px" />
                      </div>
                    </div>

                    <p className="mt-2 font-bold">2. Envía tu comprobante</p>
                    <p className="text-muted-foreground">
                      Envía el voucher por WhatsApp al{" "}
                      <a
                        href={`https://wa.me/${WHATSAPP_COMPROBANTES}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-secondary underline"
                      >
                        +{WHATSAPP_COMPROBANTES.replace(/^51/, "51 ")}
                      </a>
                      . Nuestro equipo validará tu pago y se contactará contigo para confirmar el pedido.
                    </p>

                    <p className="mt-2 font-bold">3. Importante</p>
                    <p className="text-xs text-muted-foreground">
                      Los pagos enviados a otros números que no sean +51 {DATOS_YAPE_PLIN.numero} no serán
                      procesados como pago de tu pedido — ese es el único número válido para pagos por
                      Yape/Plin.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
