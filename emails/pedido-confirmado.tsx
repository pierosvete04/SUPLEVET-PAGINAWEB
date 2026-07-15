import { Section, Text } from "@react-email/components";
import * as React from "react";
import { brand, gradients } from "./components/brand";
import { EmailLayout } from "./components/EmailLayout";
import { BodyText, CategoryLabel, CtaButton, Headline } from "./components/primitives";

export interface ItemPedido {
  nombre: string;
  cantidad: number;
  precio: number;
}

export interface PedidoConfirmadoProps {
  nombre: string;
  numeroPedido: string;
  items: ItemPedido[];
  envio: number;
  direccion: {
    nombreCompleto: string;
    direccion: string;
    distrito: string;
    telefono: string;
  };
  portalUrl?: string;
}

const fmt = (n: number) => `S/.${n.toFixed(2)}`;

export default function PedidoConfirmado({
  nombre = "Juan",
  numeroPedido = "W-1001",
  items = [{ nombre: "Suplevet 150g", cantidad: 1, precio: 99.9 }],
  envio = 15,
  direccion = {
    nombreCompleto: "Juan Pérez",
    direccion: "Av. Las Mascotas Felices 123, Dpto 402",
    distrito: "Miraflores, Lima",
    telefono: "987654321",
  },
  portalUrl = `${brand.portalUrl}/pedidos`,
}: PedidoConfirmadoProps) {
  const subtotal = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const total = subtotal + envio;

  return (
    <EmailLayout
      previewText={`Recibimos tu pedido #${numeroPedido} y ya lo estamos preparando`}
      stripeGradient={gradients.orange}
    >
      <CategoryLabel>Pedido recibido</CategoryLabel>
      <Headline>
        ¡Gracias, {nombre}!
        <br />
        Ya tenemos tu pedido
      </Headline>
      <BodyText>
        Recibimos tu pedido <strong style={{ color: brand.colors.navy }}>#{numeroPedido}</strong> y
        ya lo estamos preparando. Te avisaremos en cuanto se confirme el pago para comenzar con el
        envío.
      </BodyText>

      <Section
        style={{
          backgroundColor: brand.colors.softGray,
          borderRadius: 14,
          padding: "20px 22px",
          marginBottom: 32,
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
            <tr>
              <td>
                <Text style={{ margin: "4px 0", fontSize: 12.5, color: brand.colors.textMuted, fontFamily: brand.fonts.body }}>
                  Envío
                </Text>
              </td>
              <td align="right">
                <Text style={{ margin: "4px 0", fontSize: 12.5, color: brand.colors.textMuted, fontFamily: brand.fonts.body }}>
                  {fmt(envio)}
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
        📦 Dirección de envío
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
