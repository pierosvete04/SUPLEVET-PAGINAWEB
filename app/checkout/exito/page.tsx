"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Gift, XCircle } from "lucide-react";
import { formatPrecio } from "@/lib/data/productos-shared";
import { whatsappLink, WHATSAPP_VERDE } from "@/lib/site-config";
import { useConfiguracionSitio } from "@/hooks/use-configuracion-sitio";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { LinkQrCode } from "@/components/shared/LinkQrCode";
import { createClient } from "@/lib/supabase/client";
import { getVariantesPorSlugs, type RegaloVariante } from "@/lib/regalo-variantes";
import { fechaEntregaEstimada, fechaComoInput } from "@/lib/rotulo";
import { GoogleReviewsOptIn } from "@/components/shared/GoogleReviewsOptIn";
import { trackEvent } from "@/lib/analytics";

// Google Merchant Center — mismo merchant_id usado en el feed de productos
// (ver project_catalogo_feed_google_meta_tiktok en memoria).
const GOOGLE_MERCHANT_ID = 5564945302;

type EstadoPago = "pagado" | "pendiente_verificacion" | "rechazado" | "cancelado";

interface PedidoSimulado {
  numero: string;
  metodo: "tarjeta" | "yape_plin" | "transferencia" | "contra_entrega";
  total: number;
  nombre?: string;
  email?: string;
  telefono?: string;
  direccionTexto?: string;
  metodoEnvio?: string;
  // Slug de zona (lima | costa_sierra | selva) — mismo valor que usa el
  // rótulo de envío para estimar la fecha de entrega (lib/rotulo.ts).
  zonaEnvio?: string | null;
  productos?: { nombre: string; cantidad: number }[];
  regaloBandanas?: string[] | null;
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

// Mensaje corto para el QR del checkout — el mensaje completo (con
// productos, dirección, etc.) ya se ve en pantalla, así que repetirlo en el
// QR solo infla el payload codificado y produce un QR de tantos módulos que
// la cámara del celular no logra leerlo. El botón "Escribir por WhatsApp" sí
// usa el mensaje completo, porque ahí no hay límite de legibilidad.
function construirMensajeWhatsappCorto(pedido: PedidoSimulado): string {
  return `Hola, soy ${pedido.nombre || "[nombre]"}. Quisiera ayuda con mi pedido N° ${pedido.numero}.`;
}

function construirMensajeWhatsapp(pedido: PedidoSimulado, bandanas: RegaloVariante[]): string {
  const lineasProductos =
    pedido.productos?.map((p) => `- ${p.nombre} x${p.cantidad}`).join("\n") ?? "";
  const lineasBandanas = bandanas.map((b) => `- Bandana ${b.nombre} — Talla ${b.talla}`).join("\n");

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
    lineasBandanas && `Bandanas de regalo:\n${lineasBandanas}`,
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
  // Mercado Pago agrega esto al volver del Checkout Pro (mismo valor en
  // success/pending/failure, ya que las tres apuntan a esta misma URL). Si ya
  // dice "approved" acá, el pago se acreditó al toque — no tiene sentido
  // mostrar "estamos confirmando" mientras se espera el webhook, que puede
  // tardar unos segundos más en reflejarse en la BD. Solo se usa para decidir
  // qué mensaje mostrar en esta página — el estado real del pedido (usado
  // para todo lo demás: preparación, stock, etc.) lo sigue definiendo
  // únicamente el webhook.
  const statusMp = searchParams.get("status") ?? searchParams.get("collection_status");
  const [pedido, setPedido] = useState<PedidoSimulado | null>(null);
  const [bandanasElegidas, setBandanasElegidas] = useState<RegaloVariante[]>([]);

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
          "numero_pedido, total, estado_pago, productos, direccion_envio, zona_envio, regalo_bandana, regalo_bandanas, cliente_nombre, cliente_telefono, cliente_email"
        )
        .eq("id", pedidoIdMp)
        .maybeSingle()
        .then(({ data }) => {
          if (!data) return;
          const estadoPagoDb = data.estado_pago as EstadoPago;
          const estadoPago: EstadoPago =
            estadoPagoDb === "pendiente_verificacion" && statusMp === "approved"
              ? "pagado"
              : estadoPagoDb;
          setPedido({
            numero: data.numero_pedido ?? "",
            metodo: "tarjeta",
            total: Number(data.total),
            nombre: data.cliente_nombre ?? undefined,
            email: data.cliente_email ?? undefined,
            telefono: data.cliente_telefono ?? undefined,
            direccionTexto: direccionEnvioATexto(data.direccion_envio),
            metodoEnvio: metodoEnvioATexto(data.direccion_envio),
            zonaEnvio: data.zona_envio ?? null,
            productos: Array.isArray(data.productos)
              ? (data.productos as { nombre: string; cantidad: number }[]).map((p) => ({
                  nombre: p.nombre,
                  cantidad: p.cantidad,
                }))
              : undefined,
            regaloBandanas: Array.isArray(data.regalo_bandanas)
              ? (data.regalo_bandanas as { slug: string }[]).map((b) => b.slug)
              : data.regalo_bandana
                ? [data.regalo_bandana]
                : null,
            estadoPago,
          });
        });
      return;
    }

    const guardado = sessionStorage.getItem("ultimo_pedido");
    if (guardado) setPedido(JSON.parse(guardado));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoIdMp, statusMp]);

  // "purchase" vive acá y no en /checkout: con tarjeta el pago recién se
  // resuelve en Mercado Pago, así que mandarlo antes del redirect contaba
  // como venta a todo el que abandonaba la pasarela. Con tarjeta solo cuenta
  // cuando el pedido ya volvió "pagado"; con los demás métodos el pedido
  // queda registrado al llegar a esta página, así que ahí sí cuenta.
  // La marca en sessionStorage evita duplicarlo si se recarga la página.
  useEffect(() => {
    if (!pedido?.numero) return;
    if (pedido.metodo === "tarjeta" && pedido.estadoPago !== "pagado") return;

    const clave = `purchase_enviado_${pedido.numero}`;
    if (sessionStorage.getItem(clave)) return;
    sessionStorage.setItem(clave, "1");

    trackEvent("purchase", {
      transaction_id: pedido.numero,
      value: pedido.total,
      metodo_pago: pedido.metodo,
      items: (pedido.productos ?? []).map((p) => ({
        item_name: p.nombre,
        quantity: p.cantidad,
      })),
    });
  }, [pedido]);

  useEffect(() => {
    const slugs = pedido?.regaloBandanas ?? [];
    if (slugs.length === 0) {
      setBandanasElegidas([]);
      return;
    }
    getVariantesPorSlugs(createClient(), slugs).then(setBandanasElegidas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido?.regaloBandanas?.join(",")]);

  const linkWhatsapp = pedido
    ? whatsappLink(config.whatsappB2C, construirMensajeWhatsapp(pedido, bandanasElegidas))
    : null;
  // El QR usa el mensaje corto (ver construirMensajeWhatsappCorto) — con el
  // mensaje completo el payload es tan largo que el QR sale con demasiados
  // módulos para escanearlo con la cámara del celular.
  const linkWhatsappQr = pedido ? whatsappLink(config.whatsappB2C, construirMensajeWhatsappCorto(pedido)) : null;

  const pagoTarjetaResuelto = pedido?.metodo === "tarjeta" ? pedido.estadoPago : undefined;
  const mostrarCardWhatsapp = pedido && pagoTarjetaResuelto !== "pagado";

  const pagoFallido = pagoTarjetaResuelto === "rechazado" || pagoTarjetaResuelto === "cancelado";

  return (
    <>
      {pedido && pedido.email && !pagoFallido && (
        <GoogleReviewsOptIn
          merchantId={GOOGLE_MERCHANT_ID}
          orderId={pedido.numero}
          email={pedido.email}
          deliveryCountry="PE"
          estimatedDeliveryDate={fechaComoInput(fechaEntregaEstimada(pedido.zonaEnvio ?? null))}
        />
      )}
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
          {bandanasElegidas.map((bandana, i) => (
            <div
              key={`${bandana.slug}-${i}`}
              className="mt-3 flex items-center gap-3 rounded-md bg-soft-gray p-2.5"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white">
                {bandana.imagen && (
                  <Image
                    src={bandana.imagen}
                    alt={`Bandana ${bandana.nombre}`}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                )}
              </div>
              <p className="flex items-center gap-1.5 font-body text-xs">
                <Gift className="h-4 w-4 shrink-0 text-secondary" strokeWidth={1.75} />
                Tu regalo: <strong>Bandana {bandana.nombre} — Talla {bandana.talla}</strong>
              </p>
            </div>
          ))}
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
              style={{ backgroundColor: WHATSAPP_VERDE }}
              className="flex w-full items-center justify-center gap-2 rounded-[17px] px-5 py-3 font-body text-sm font-bold text-white hover:opacity-90 sm:flex-1"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Escribir por WhatsApp
            </a>
            <div className="flex shrink-0 flex-col items-center gap-1">
              {linkWhatsappQr && <LinkQrCode link={linkWhatsappQr} size={150} />}
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
    </>
  );
}

export default function CheckoutExitoPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutExitoContent />
    </Suspense>
  );
}
