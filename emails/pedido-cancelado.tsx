import * as React from "react";
import { brand, gradients } from "./components/brand";
import { EmailLayout } from "./components/EmailLayout";
import {
  AlertBox,
  BodyText,
  CategoryLabel,
  CtaButton,
  Divider,
  Headline,
} from "./components/primitives";

export interface PedidoCanceladoProps {
  nombre: string;
  numeroPedido: string;
  motivo?: string;
  tiendaUrl?: string;
  whatsappUrl: string;
}

export default function PedidoCancelado({
  nombre = "Juan",
  numeroPedido = "W-1001",
  motivo = "no pudimos completar el proceso de compra",
  tiendaUrl = `${brand.siteUrl}/productos`,
  whatsappUrl = "https://wa.me/51920723721",
}: PedidoCanceladoProps) {
  return (
    <EmailLayout
      previewText={`Cancelamos tu pedido #${numeroPedido} — escríbenos si fue un error`}
      stripeGradient={gradients.red}
    >
      <CategoryLabel icon="xError">Pedido cancelado</CategoryLabel>
      <Headline size="md" color={brand.colors.error}>
        Cancelamos tu pedido, {nombre}
      </Headline>

      <AlertBox tone="error" title={`El pedido #${numeroPedido} quedó cancelado`}>
        Motivo: {motivo}. No se te cobró nada. Si no hiciste este pedido o crees que fue un error,
        escríbenos y lo revisamos contigo.
      </AlertBox>

      <CtaButton href={tiendaUrl} marginBottom={14}>
        Volver a la tienda →
      </CtaButton>
      <CtaButton href={whatsappUrl} variant="whatsapp">
        Consultar por WhatsApp
      </CtaButton>

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
