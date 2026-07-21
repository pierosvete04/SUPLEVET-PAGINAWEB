import { Section } from "@react-email/components";
import * as React from "react";
import { brand, gradients } from "./components/brand";
import { EmailLayout } from "./components/EmailLayout";
import { BodyText, CategoryLabel, CtaButton, Divider, Headline } from "./components/primitives";

export interface PedidoCanceladoProps {
  nombre: string;
  numeroPedido: string;
  motivo?: string;
  tiendaUrl?: string;
  whatsappUrl?: string;
}

export default function PedidoCancelado({
  nombre = "Juan",
  numeroPedido = "W-1001",
  motivo = "no pudimos completar el proceso de compra",
  tiendaUrl = `${brand.siteUrl}/productos`,
  whatsappUrl = "https://wa.me/51999999999",
}: PedidoCanceladoProps) {
  return (
    <EmailLayout
      previewText={`Tu pedido #${numeroPedido} fue cancelado`}
      stripeGradient={gradients.red}
    >
      <CategoryLabel>Pedido cancelado</CategoryLabel>
      <Headline color={brand.colors.error}>Cancelamos tu pedido, {nombre}</Headline>
      <BodyText>
        Tu pedido <strong style={{ color: brand.colors.navy }}>#{numeroPedido}</strong> fue
        cancelado: {motivo}. Si no realizaste este pedido o crees que se trata de un error,
        escríbenos y lo revisamos contigo.
      </BodyText>

      <Section style={{ marginBottom: 8 }}>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td width="50%" style={{ paddingRight: 6 }}>
                <CtaButton href={tiendaUrl}>Volver a la tienda →</CtaButton>
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
