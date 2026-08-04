import { Section, Text } from "@react-email/components";
import * as React from "react";
import { brand, gradients, shadows } from "./components/brand";
import { EmailLayout } from "./components/EmailLayout";
import {
  AlertBox,
  BodyText,
  CategoryLabel,
  CtaButton,
  EmailIcon,
  Headline,
  OrderProgress,
  StepsList,
} from "./components/primitives";

export interface ItemPedido {
  nombre: string;
  cantidad: number;
  precio: number;
}

export type MetodoPagoPedido = "Yape" | "Plin" | "transferencia" | "tarjeta" | "contra entrega";

export interface PedidoConfirmadoProps {
  nombre: string;
  numeroPedido: string;
  items: ItemPedido[];
  subtotal: number;
  envio: number;
  /** Monto descontado por cupón o canje de SuplePoints. */
  descuento?: number;
  /** Viene de `pedidos.total`, no se recalcula acá: si el correo hiciera su
   * propia suma podría mostrar un monto distinto al que el cliente ve en el
   * portal cuando hay descuentos de por medio. */
  total: number;
  metodoPago: MetodoPagoPedido;
  direccion: {
    nombreCompleto: string;
    direccion: string;
    distrito: string;
    telefono: string;
  };
  whatsappUrl: string;
  portalUrl?: string;
}

const fmt = (n: number) => `S/.${n.toFixed(2)}`;

// Qué le toca hacer al cliente según cómo eligió pagar. Antes esto vivía en un
// correo aparte (pago-en-verificacion), así que al comprar con Yape llegaban
// dos mensajes: uno con el detalle del pedido y otro con los pasos del pago.
// Ahora es un solo correo — el detalle y el "qué sigue" no tienen por qué ir
// separados, y dos correos seguidos por la misma compra se leen como spam.
function pasoDePago(metodoPago: MetodoPagoPedido, numeroPedido: string) {
  if (metodoPago === "contra entrega") {
    return {
      tone: "info" as const,
      titulo: "Pagas cuando lo recibas",
      cuerpo:
        "No tienes que adelantar nada. Le pagas al motorizado al momento de la entrega, en efectivo o por Yape/Plin.",
      pasos: [
        {
          title: "Coordinamos la entrega",
          description: "Te escribimos por WhatsApp para acordar día y hora.",
        },
        { title: "Preparamos tu pedido", description: "Lo alistamos y sale con el motorizado." },
        {
          title: "Pagas al recibir",
          description: "Ten listo el monto exacto, o paga por Yape/Plin en la puerta.",
        },
      ],
      cta: "Coordinar mi entrega",
    };
  }

  if (metodoPago === "tarjeta") {
    return {
      tone: "info" as const,
      titulo: "Estamos validando tu pago con el banco",
      cuerpo:
        "No tienes que hacer nada: en cuanto el banco confirme la transacción te llega el correo de pago confirmado.",
      pasos: null,
      cta: null,
    };
  }

  const medio = metodoPago === "transferencia" ? "tu constancia de transferencia" : `tu voucher de ${metodoPago}`;
  return {
    tone: "warn" as const,
    titulo: `Falta un paso para confirmar el pedido #${numeroPedido}`,
    cuerpo: `Necesitamos ${medio} para validar el pago. Puedes enviárnoslo por WhatsApp o respondiendo a este mismo correo.`,
    pasos: [
      {
        title: "Envíanos tu comprobante",
        description: "El mensaje de WhatsApp ya va con tu número de pedido, solo adjunta la captura.",
      },
      { title: "Lo validamos", description: "Nuestro equipo verifica la transacción en minutos." },
      {
        title: "Preparamos y despachamos",
        description: "Te avisamos por correo apenas el pedido salga en camino.",
      },
    ],
    cta: "Enviar mi comprobante",
  };
}

export default function PedidoConfirmado({
  nombre = "Juan",
  numeroPedido = "W-1001",
  items = [{ nombre: "Suplevet 150g", cantidad: 1, precio: 99.9 }],
  subtotal = 99.9,
  envio = 15,
  descuento = 0,
  total = 114.9,
  metodoPago = "Yape",
  direccion = {
    nombreCompleto: "Juan Pérez",
    direccion: "Av. Las Mascotas Felices 123, Dpto 402",
    distrito: "Miraflores, Lima",
    telefono: "987654321",
  },
  whatsappUrl = "https://wa.me/51920723721",
  portalUrl = `${brand.portalUrl}/pedidos`,
}: PedidoConfirmadoProps) {
  const paso = pasoDePago(metodoPago, numeroPedido);

  return (
    <EmailLayout
      previewText={
        paso.cta
          ? `Recibimos tu pedido #${numeroPedido} — falta confirmar el pago`
          : `Recibimos tu pedido #${numeroPedido}`
      }
      stripeGradient={paso.tone === "warn" ? gradients.warn : gradients.orange}
    >
      <CategoryLabel icon="package">Pedido recibido</CategoryLabel>
      <Headline>
        ¡Gracias, {nombre}!
        <br />
        Ya tenemos tu pedido
      </Headline>

      <OrderProgress current="recibido" />

      <AlertBox tone={paso.tone} title={paso.titulo}>
        {paso.cuerpo}
      </AlertBox>

      {paso.pasos ? <StepsList title="¿Qué pasa ahora?" steps={paso.pasos} /> : null}

      {paso.cta ? (
        <CtaButton href={whatsappUrl} variant="whatsapp">
          {paso.cta}
        </CtaButton>
      ) : null}

      <Section
        style={{
          backgroundColor: brand.colors.softGray,
          border: `1px solid ${brand.colors.border}`,
          borderRadius: 14,
          padding: "20px 22px",
          marginBottom: 32,
          boxShadow: shadows.raised,
        }}
      >
        <Text
          style={{
            margin: "0 0 14px",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".08em",
            color: brand.colors.textFaint,
            fontFamily: brand.fonts.body,
            borderBottom: `1px solid ${brand.colors.border}`,
            paddingBottom: 12,
          }}
        >
          Resumen de compra
        </Text>

        {items.map((item) => (
          <table
            role="presentation"
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            key={item.nombre}
            style={{ marginBottom: 10 }}
          >
            <tbody>
              <tr>
                <td>
                  <Text
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      color: brand.colors.navy,
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    {item.nombre}
                  </Text>
                  <Text
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: brand.colors.textMuted,
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    Cantidad: {item.cantidad}
                  </Text>
                </td>
                <td align="right" valign="top">
                  <Text
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      color: brand.colors.navy,
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    {fmt(item.precio * item.cantidad)}
                  </Text>
                </td>
              </tr>
            </tbody>
          </table>
        ))}

        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ borderTop: `1px solid ${brand.colors.border}`, paddingTop: 10, marginTop: 6 }}
        >
          <tbody>
            <tr>
              <td>
                <Text style={{ margin: "4px 0", fontSize: 12.5, color: brand.colors.textMuted, fontFamily: brand.fonts.body }}>
                  Subtotal
                </Text>
              </td>
              <td align="right">
                <Text style={{ margin: "4px 0", fontSize: 12.5, color: brand.colors.textMuted, fontFamily: brand.fonts.body }}>
                  {fmt(subtotal)}
                </Text>
              </td>
            </tr>
            {descuento > 0 ? (
              <tr>
                <td>
                  <Text style={{ margin: "4px 0", fontSize: 12.5, color: brand.colors.success, fontFamily: brand.fonts.body }}>
                    Descuento
                  </Text>
                </td>
                <td align="right">
                  <Text style={{ margin: "4px 0", fontSize: 12.5, color: brand.colors.success, fontFamily: brand.fonts.body, fontVariantNumeric: "tabular-nums" }}>
                    −{fmt(descuento)}
                  </Text>
                </td>
              </tr>
            ) : null}
            <tr>
              <td>
                <Text style={{ margin: "4px 0", fontSize: 12.5, color: brand.colors.textMuted, fontFamily: brand.fonts.body }}>
                  Envío
                </Text>
              </td>
              <td align="right">
                <Text style={{ margin: "4px 0", fontSize: 12.5, color: brand.colors.textMuted, fontFamily: brand.fonts.body, fontVariantNumeric: "tabular-nums" }}>
                  {envio > 0 ? fmt(envio) : "Gratis"}
                </Text>
              </td>
            </tr>
            <tr>
              <td style={{ borderTop: `1px solid ${brand.colors.sky}44`, paddingTop: 8 }}>
                <Text style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 700, color: brand.colors.navy, fontFamily: brand.fonts.body }}>
                  Total
                </Text>
              </td>
              <td align="right" style={{ borderTop: `1px solid ${brand.colors.sky}44`, paddingTop: 8 }}>
                <Text style={{ margin: "4px 0 0", fontSize: 16, fontWeight: 800, color: brand.colors.orange, fontFamily: brand.fonts.body }}>
                  {fmt(total)}
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Text
        style={{
          margin: "0 0 8px",
          fontSize: 13,
          fontWeight: 700,
          color: brand.colors.navy,
          fontFamily: brand.fonts.body,
        }}
      >
        <EmailIcon name="mapPin" marginRight={7} />
        Dirección de envío
      </Text>
      <BodyText marginBottom={32}>
        {direccion.nombreCompleto}
        <br />
        {direccion.direccion}
        <br />
        {direccion.distrito}
        <br />
        Tel: {direccion.telefono}
      </BodyText>

      <CtaButton href={portalUrl}>Ver estado de mi pedido →</CtaButton>
    </EmailLayout>
  );
}
