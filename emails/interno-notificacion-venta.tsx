import { Section } from "@react-email/components";
import * as React from "react";
import { brand, gradients } from "./components/brand";
import { EmailLayout } from "./components/EmailLayout";
import { BodyText, CategoryLabel, CtaButton, Headline } from "./components/primitives";

export type EventoNotificacionVenta =
  | "nuevo_pedido"
  | "pago_confirmado"
  | "pago_rechazado"
  | "pago_cancelado";

export interface NotificacionVentaProps {
  evento: EventoNotificacionVenta;
  numeroPedido: string;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string | null;
  metodoPago: string;
  total: number;
  urlPedido: string;
}

const CONFIG_EVENTO: Record<
  EventoNotificacionVenta,
  { categoria: string; titulo: string; gradiente: string }
> = {
  nuevo_pedido: {
    categoria: "Nuevo pedido",
    titulo: "Se registró un pedido nuevo",
    gradiente: gradients.sky,
  },
  pago_confirmado: {
    categoria: "Pago confirmado",
    titulo: "Un pago fue confirmado",
    gradiente: gradients.green,
  },
  pago_rechazado: {
    categoria: "Pago rechazado",
    titulo: "Un pago fue rechazado",
    gradiente: gradients.red,
  },
  pago_cancelado: {
    categoria: "Pago cancelado",
    titulo: "Un pago fue cancelado",
    gradiente: gradients.warn,
  },
};

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: 8 }}>
      <tbody>
        <tr>
          <td
            width={110}
            style={{ fontSize: 12.5, color: brand.colors.textFaint, fontFamily: brand.fonts.body }}
          >
            {label}
          </td>
          <td
            style={{
              fontSize: 13.5,
              color: brand.colors.navy,
              fontWeight: 600,
              fontFamily: brand.fonts.body,
            }}
          >
            {valor}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// Correo interno para el equipo de ventas (ventas@suplevet.pe), distinto de
// los correos de marca que le llegan al cliente: mismo layout base para no
// mantener dos sistemas de plantillas, pero contenido puramente funcional
// (datos del pedido + link al panel), sin footer de redes ni tono comercial.
export default function NotificacionVenta({
  evento,
  numeroPedido = "W-1001",
  clienteNombre = "Juan Pérez",
  clienteEmail = "juan@example.com",
  clienteTelefono = "999999999",
  metodoPago = "Yape / Plin",
  total = 120,
  urlPedido = "https://suplevet.pe/admin/pedidos/",
}: NotificacionVentaProps) {
  const config = CONFIG_EVENTO[evento];

  return (
    <EmailLayout
      previewText={`${config.titulo} — pedido #${numeroPedido}`}
      stripeGradient={config.gradiente}
    >
      <CategoryLabel>{config.categoria}</CategoryLabel>
      <Headline>{config.titulo}</Headline>
      <BodyText>
        Pedido <strong style={{ color: brand.colors.navy }}>#{numeroPedido}</strong>.
      </BodyText>

      <Section
        style={{
          backgroundColor: brand.colors.softGray,
          borderRadius: 14,
          padding: "18px 20px",
          marginBottom: 28,
        }}
      >
        <Dato label="Cliente" valor={clienteNombre} />
        <Dato label="Correo" valor={clienteEmail} />
        {clienteTelefono ? <Dato label="Teléfono" valor={clienteTelefono} /> : null}
        <Dato label="Método de pago" valor={metodoPago} />
        <Dato label="Total" valor={`S/ ${total.toFixed(2)}`} />
      </Section>

      <CtaButton href={urlPedido}>Ver pedido en el panel →</CtaButton>
    </EmailLayout>
  );
}
