import { Section } from "@react-email/components";
import * as React from "react";
import { brand, gradients } from "./components/brand";
import { EmailLayout } from "./components/EmailLayout";
import { BodyText, CategoryLabel, CtaButton, Divider, Headline } from "./components/primitives";

export interface PagoRechazadoProps {
  nombre: string;
  numeroPedido: string;
  motivo?: string;
  reintentarUrl?: string;
  whatsappUrl?: string;
}

export default function PagoRechazado({
  nombre = "Juan",
  numeroPedido = "W-1001",
  motivo = "tarjeta rechazada por el banco",
  reintentarUrl = `${brand.portalUrl}/pedidos`,
  whatsappUrl = "https://wa.me/51999999999",
}: PagoRechazadoProps) {
  return (
    <EmailLayout
      previewText={`Hubo un problema con tu pago — pedido #${numeroPedido}`}
      stripeGradient={gradients.red}
    >
      <CategoryLabel>Pago no confirmado</CategoryLabel>
      <Headline color={brand.colors.error}>No pudimos confirmar tu pago, {nombre}</Headline>
      <BodyText>
        Tu pedido <strong style={{ color: brand.colors.navy }}>#{numeroPedido}</strong> no pudo
        procesarse: {motivo}. No te preocupes, tus productos siguen reservados por un momento.
      </BodyText>

      <Section style={{ marginBottom: 8 }}>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td width="50%" style={{ paddingRight: 6 }}>
                <CtaButton href={reintentarUrl}>Reintentar pago →</CtaButton>
              </td>
              <td width="50%" style={{ paddingLeft: 6 }}>
                <CtaButton href={whatsappUrl} variant="outline">
                  Escribir por WhatsApp
                </CtaButton>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Divider />
      <BodyText marginBottom={0}>
        ¿Tienes dudas o necesitas ayuda? Escríbenos a{" "}
        <a href={`mailto:${brand.supportEmail}`} style={{ color: brand.colors.orange }}>
          {brand.supportEmail}
        </a>
        .
      </BodyText>
    </EmailLayout>
  );
}
