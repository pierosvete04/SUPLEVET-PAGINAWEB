"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Gift, XCircle } from "lucide-react";
import { formatPrecio } from "@/lib/data/productos-shared";
import { whatsappLink } from "@/lib/site-config";
import { useConfiguracionSitio } from "@/hooks/use-configuracion-sitio";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { LinkQrCode } from "@/components/shared/LinkQrCode";
import { createClient } from "@/lib/supabase/client";
import { getVariantePorSlug, type RegaloVariante } from "@/lib/regalo-variantes";

type EstadoPago = "pagado" | "pendiente_verificacion" | "rechazado" | "cancelado";

interface PedidoSimulado {
  numero: string;
  metodo: "tarjeta" | "yape_plin" | "transferencia" | "contra_entrega";
  total: number;
  nombre?: string;
  telefono?: string;
  direccionTexto?: string;
  metodoEnvio?: string;
  productos?: { nombre: string; cantidad: number }[];
  regaloBandana?: string | null;
  // Solo se llena para el pedido leído en vivo de la BD (flujo de tarjeta) —
  // el pago con Mercado Pago se confirma vía webhook, no al volver del
  // checkout, así que acá se necesita el estado real, no uno asumido.
  estadoPago?: EstadoPago;
}

const mensajePorMetodo: Record<PedidoSimulado["metodo"], string> = {
  tarjeta: "Estamos confirmando tu pago…",
  yape_plin: "Recibimos tu pedido — estamos validando tu pago",
  transferencia: "Recibimos tu pedido — estamos validando tu pago",
  contra_entrega: "¡Pedido confirmado! Pagas al recibirlo",
};

const TITULO_POR_ESTADO_PAGO: Record<EstadoPago, string> = {
  pagado: "¡Tu pago fue confirmado!",
  pendiente_verificacion: "Estamos confirmando tu pago con Mercado Pago…",
  rechazado: "Tu pago no pudo procesarse",
  cancelado: "Tu pago fue cancelado",
};

function tituloPedido(pedido: PedidoSimulado): string {
  if (pedido.metodo === "tarjeta" && pedido.estadoPago) {
    return TITULO_POR_ESTADO_PAGO[pedido.estadoPago];
  }
  return mensajePorMetodo[pedido.metodo];
}

function construirMensajeWhatsapp(pedido: PedidoSimulado, bandana: RegaloVariante | null): string {
  const lineasProductos =
    pedido.productos?.map((p) => `- ${p.nombre} x${p.cantidad}`).join("\n") ?? "";

  let lineaFinal = "Les envío el comprobante de pago a continuación.";
  if (pedido.metodo === "contra_entrega") {
    lineaFinal = "Pago contra entrega — quisiera coordinar la fecha y hora de entrega.";
  } else if (pedido.metodo === "tarjeta") {
    lineaFinal =
      pedido.estadoPago === "rechazado" || pedido.estadoPago === "cancelado"
        ? "Tuve un problema pagando con tarjeta y quisiera ayuda para completar mi compra."
        : "Quisiera saber en qué va mi pedido.";
  }

  return [
    `Hola, soy ${pedido.nombre || "[nombre]"}.`,
    `Acabo de hacer el pedido N° ${pedido.numero} por ${formatPrecio(pedido.total)}.`,
    lineasProductos && `Productos:\n${lineasProductos}`,
    bandana && `Bandana de regalo: ${bandana.nombre}`,
    pedido.direccionTexto && `Dirección de envío: ${pedido.direccionTexto}`,
    pedido.metodoEnvio && `Método de envío: ${pedido.metodoEnvio}`,
    lineaFinal,
  ]
    .filter(Boolean)
    .join("\n\n");
}

// Reconstruye el mismo objeto PedidoSimulado que las demás formas de pago
// dejan en sessionStorage, pero leyendo el pedido real de la BD — necesario
// porque el resultado de un pago con tarjeta lo decide Mercado Pago (vía
// webhook), no el navegador que vuelve del checkout.
function direccionEnvioATexto(direccionEnvio: unknown): string | undefined {
  if (!direccionEnvio || typeof direccionEnvio !== "object") return undefined;
  const d = direccionEnvio as Record<string, unknown>;
  return [d.direccion, d.distrito, d.provincia, d.departamento]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .join(", ");
}

function metodoEnvioATexto(direccionEnvio: unknown): string | undefined {
  if (!direccionEnvio || typeof direccionEnvio !== "object") return undefined;
  const metodo = (direccionEnvio as Record<string, unknown>).metodoEnvio;
  if (!metodo) return undefined;
  return metodo === "shalom" ? "Agencia Shalom" : "Delivery motorizado";
}

function CheckoutExitoContent() {
  const config = useConfiguracionSitio();
  const searchParams = useSearchParams();
  const pedidoIdMp = searchParams.get("pedido");
  const [pedido, setPedido] = useState<PedidoSimulado | null>(null);
  const [bandanaElegida, setBandanaElegida] = useState<RegaloVariante | null>(null);

  useEffect(() => {
    // Flujo de tarjeta: se vuelve de Mercado Pago con ?pedido=<id> — el
    // resultado real lo decide el webhook, así que acá se relee el pedido de
    // la BD en vez de confiar en sessionStorage (que para este método nunca
    // se llegó a escribir).
    if (pedidoIdMp) {
      const supabase = createClient();
      supabase
        .from("pedidos")
        .select(
          "shopify_order_number, total, estado_pago, productos, direccion_envio, zona_envio, regalo_bandana, cliente_nombre, cliente_telefono"
        )
        .eq("id", pedidoIdMp)
        .maybeSingle()
        .then(({ data }) => {
          if (!data) return;
          setPedido({
            numero: data.shopify_order_number ?? "",
            metodo: "tarjeta",
            total: Number(data.total),
            nombre: data.cliente_nombre ?? undefined,
            telefono: data.cliente_telefono ?? undefined,
            direccionTexto: direccionEnvioATexto(data.direccion_envio),
            metodoEnvio: metodoEnvioATexto(data.direccion_envio),
            productos: Array.isArray(data.productos)
              ? (data.productos as { nombre: string; cantidad: number }[]).map((p) => ({
                  nombre: p.nombre,
                  cantidad: p.cantidad,
                }))
              : undefined,
            regaloBandana: data.regalo_bandana,
            estadoPago: data.estado_pago as EstadoPago,
          });
        });
      return;
    }

    const guardado = sessionStorage.getItem("ultimo_pedido");
    if (guardado) setPedido(JSON.parse(guardado));
  }, [pedidoIdMp]);

  useEffect(() => {
    getVariantePorSlug(createClient(), pedido?.regaloBandana ?? null).then(setBandanaElegida);
  }, [pedido?.regaloBandana]);

  const linkWhatsapp = pedido
    ? whatsappLink(config.whatsappB2C, construirMensajeWhatsapp(pedido, bandanaElegida))
    : null;

  const pagoTarjetaResuelto = pedido?.metodo === "tarjeta" ? pedido.estadoPago : undefined;
  const mostrarCardWhatsapp = pedido && pagoTarjetaResuelto !== "pagado";

  const pagoFallido = pagoTarjetaResuelto === "rechazado" || pagoTarjetaResuelto === "cancelado";

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-mobile-margin py-section-y text-center">
      {pagoFallido ? (
        <XCircle className="h-16 w-16 text-destructive" strokeWidth={1.5} />
      ) : (
        <CheckCircle2 className="h-16 w-16 text-green-500" strokeWidth={1.5} />
      )}
      <h1 className="font-display text-3xl font-bold text-secondary">
        {pedido ? tituloPedido(pedido) : "¡Gracias por tu compra!"}
      </h1>

      {pedido && (
        <div className="mt-2 w-full rounded-[var(--radius-card,1rem)] border border-border p-5 text-left font-body text-sm text-secondary">
          <div className="flex justify-between">
            <span>N° de pedido</span>
            <span className="font-bold">{pedido.numero}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span>Total</span>
            <span className="font-bold text-secondary">{formatPrecio(pedido.total)}</span>
          </div>
          {bandanaElegida && (
            <div className="mt-3 flex items-center gap-3 rounded-md bg-soft-gray p-2.5">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white">
                {bandanaElegida.imagen && (
                  <Image
                    src={bandanaElegida.imagen}
                    alt={`Bandana ${bandanaElegida.nombre}`}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                )}
              </div>
              <p className="flex items-center gap-1.5 font-body text-xs">
                <Gift className="h-4 w-4 shrink-0 text-secondary" strokeWidth={1.75} />
                Tu regalo: <strong>Bandana {bandanaElegida.nombre}</strong>
              </p>
            </div>
          )}
          {pedido.metodo === "contra_entrega" && (
            <p className="mt-3 text-xs text-muted-foreground">
              Coordinaremos la entrega por WhatsApp. Ten listos {formatPrecio(pedido.total)} para
              pagarle al motorizado cuando te entregue el pedido.
            </p>
          )}
          {pedido.metodo === "tarjeta" && pagoTarjetaResuelto === "pendiente_verificacion" && (
            <p className="mt-3 text-xs text-muted-foreground">
              Estamos confirmando tu pago con Mercado Pago — te avisaremos por correo apenas quede
              listo, normalmente toma solo unos segundos.
            </p>
          )}
          {pedido.metodo === "tarjeta" &&
            (pagoTarjetaResuelto === "rechazado" || pagoTarjetaResuelto === "cancelado") && (
              <p className="mt-3 text-xs text-destructive">
                No pudimos procesar tu pago con tarjeta. Escríbenos por WhatsApp y te ayudamos a
                completar tu compra.
              </p>
            )}
          {pedido.metodo !== "contra_entrega" && pedido.metodo !== "tarjeta" && (
            <p className="mt-3 text-xs text-muted-foreground">
              Te enviaremos las instrucciones de pago y confirmaremos por WhatsApp y correo en las
              próximas horas.
            </p>
          )}
        </div>
      )}

      {mostrarCardWhatsapp && linkWhatsapp && (
        <div className="w-full rounded-[var(--radius-card,1rem)] border-2 border-dashed border-accent bg-accent/10 p-5 text-left">
          <p className="font-body text-sm font-bold text-secondary">
            {pedido.metodo === "tarjeta" ? "¿Necesitas ayuda?" : "Confirma tu pedido por WhatsApp"}
          </p>
          <p className="mt-1 font-body text-xs text-muted-foreground">
            {pedido.metodo === "contra_entrega"
              ? "Escríbenos para coordinar la fecha y hora de tu entrega."
              : pedido.metodo === "tarjeta"
                ? "Escríbenos si tu pago no se confirma o tuviste algún problema."
                : "Envíanos tu comprobante de pago para que validemos tu pedido más rápido."}
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

      {pedido && !mostrarCardWhatsapp && (
        <Link
          href="/mi-cuenta/pedidos"
          className="flex w-full max-w-xs items-center justify-center gap-2 rounded-[17px] border-2 border-secondary px-5 py-3 font-body text-sm font-bold text-secondary hover:bg-secondary hover:text-white"
        >
          Ver mi pedido en Mi cuenta
        </Link>
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

export default function CheckoutExitoPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutExitoContent />
    </Suspense>
  );
}
