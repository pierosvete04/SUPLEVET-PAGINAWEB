"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Gift } from "lucide-react";
import { formatPrecio } from "@/lib/data/productos-shared";
import { whatsappLink } from "@/lib/site-config";
import { useConfiguracionSitio } from "@/hooks/use-configuracion-sitio";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { LinkQrCode } from "@/components/shared/LinkQrCode";
import { getBandanaRegaloPorSlug } from "@/lib/data/bandanas-regalo";

interface PedidoSimulado {
  numero: string;
  metodo: "tarjeta" | "yape_plin" | "transferencia";
  total: number;
  nombre?: string;
  telefono?: string;
  direccionTexto?: string;
  metodoEnvio?: string;
  productos?: { nombre: string; cantidad: number }[];
  regaloBandana?: string | null;
}

const mensajePorMetodo: Record<PedidoSimulado["metodo"], string> = {
  tarjeta: "¡Tu pago fue confirmado!",
  yape_plin: "Recibimos tu pedido — estamos validando tu pago",
  transferencia: "Recibimos tu pedido — estamos validando tu pago",
};

function construirMensajeWhatsapp(pedido: PedidoSimulado): string {
  const lineasProductos =
    pedido.productos?.map((p) => `- ${p.nombre} x${p.cantidad}`).join("\n") ?? "";
  const bandana = getBandanaRegaloPorSlug(pedido.regaloBandana ?? null);
  return [
    `Hola, soy ${pedido.nombre || "[nombre]"}.`,
    `Acabo de hacer el pedido N° ${pedido.numero} por ${formatPrecio(pedido.total)}.`,
    lineasProductos && `Productos:\n${lineasProductos}`,
    bandana && `Bandana de regalo: ${bandana.nombre}`,
    pedido.direccionTexto && `Dirección de envío: ${pedido.direccionTexto}`,
    pedido.metodoEnvio && `Método de envío: ${pedido.metodoEnvio}`,
    "Les envío el comprobante de pago a continuación.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export default function CheckoutExitoPage() {
  const config = useConfiguracionSitio();
  const [pedido, setPedido] = useState<PedidoSimulado | null>(null);

  useEffect(() => {
    const guardado = sessionStorage.getItem("ultimo_pedido");
    if (guardado) setPedido(JSON.parse(guardado));
  }, []);

  const linkWhatsapp = pedido
    ? whatsappLink(config.whatsappB2C, construirMensajeWhatsapp(pedido))
    : null;
  const bandanaElegida = getBandanaRegaloPorSlug(pedido?.regaloBandana ?? null);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-mobile-margin py-section-y text-center">
      <CheckCircle2 className="h-16 w-16 text-green-500" strokeWidth={1.5} />
      <h1 className="font-display text-3xl font-bold text-secondary">
        {pedido ? mensajePorMetodo[pedido.metodo] : "¡Gracias por tu compra!"}
      </h1>

      {pedido && (
        <div className="mt-2 w-full rounded-[var(--radius-card,1rem)] border border-border p-5 text-left font-body text-sm text-secondary">
          <div className="flex justify-between">
            <span>N° de pedido</span>
            <span className="font-bold">{pedido.numero}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span>Total</span>
            <span className="font-bold text-primary">{formatPrecio(pedido.total)}</span>
          </div>
          {bandanaElegida && (
            <div className="mt-3 flex items-center gap-3 rounded-md bg-soft-gray p-2.5">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white">
                <Image
                  src={bandanaElegida.imagen}
                  alt={`Bandana ${bandanaElegida.nombre}`}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <p className="flex items-center gap-1.5 font-body text-xs">
                <Gift className="h-4 w-4 shrink-0 text-secondary" strokeWidth={1.75} />
                Tu regalo: <strong>Bandana {bandanaElegida.nombre}</strong>
              </p>
            </div>
          )}
          {pedido.metodo !== "tarjeta" && (
            <p className="mt-3 text-xs text-muted-foreground">
              Te enviaremos las instrucciones de pago y confirmaremos por WhatsApp y correo en las
              próximas horas.
            </p>
          )}
        </div>
      )}

      {pedido && linkWhatsapp && (
        <div className="w-full rounded-[var(--radius-card,1rem)] border-2 border-dashed border-accent bg-accent/10 p-5 text-left">
          <p className="font-body text-sm font-bold text-secondary">
            Confirma tu pedido por WhatsApp
          </p>
          <p className="mt-1 font-body text-xs text-muted-foreground">
            Envíanos tu comprobante de pago para que validemos tu pedido más rápido.
          </p>
          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <a
              href={linkWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              style={{ backgroundColor: "#25D366" }}
              className="flex w-full items-center justify-center gap-2 rounded-[17px] px-5 py-3 font-body text-sm font-bold text-white hover:opacity-90 sm:flex-1"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Escribir por WhatsApp
            </a>
            <div className="flex shrink-0 flex-col items-center gap-1">
              <LinkQrCode link={linkWhatsapp} size={150} />
              <span className="font-body text-[11px] text-muted-foreground">O escanea el QR</span>
            </div>
          </div>

          <Link
            href="/mi-cuenta/pedidos"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-[17px] border-2 border-secondary px-5 py-3 font-body text-sm font-bold text-secondary hover:bg-secondary hover:text-white"
          >
            Ver mi pedido en Mi cuenta
          </Link>
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <Link
          href="/productos"
          className="rounded-[17px] bg-primary px-6 py-3 font-body font-bold text-primary-foreground hover:opacity-90"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
