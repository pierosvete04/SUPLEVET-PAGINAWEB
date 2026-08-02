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
  OrderProgress,
} from "./components/primitives";

export interface PagoRechazadoProps {
  nombre: string;
  numeroPedido: string;
  motivo?: string;
  reintentarUrl?: string;
  whatsappUrl: string;
}

export default function PagoRechazado({
  nombre = "Juan",
  numeroPedido = "W-1001",
  motivo = "tarjeta rechazada por el banco",
  reintentarUrl = `${brand.portalUrl}/pedidos`,
  whatsappUrl = "https://wa.me/51920723721",
}: PagoRechazadoProps) {
  return (
    <EmailLayout
      previewText={`No pudimos confirmar el pago de tu pedido #${numeroPedido} — puedes reintentarlo`}
      stripeGradient={gradients.red}
    >
      <CategoryLabel icon="alertError">Pago no confirmado</CategoryLabel>
      <Headline size="md" color={brand.colors.error}>
        No pudimos confirmar tu pago, {nombre}
      </Headline>

      <OrderProgress current="pagado" tone="error" />

      <AlertBox tone="error" title={`El pago del pedido #${numeroPedido} no se procesó`}>
        Motivo: {motivo}. Tus productos siguen reservados por un momento, así que puedes reintentar
        el pago sin volver a armar el carrito.
      </AlertBox>

      {/* Un solo CTA principal: reintentar es lo que resuelve el problema.
          WhatsApp queda abajo como salida para quien no pueda reintentar. */}
      <CtaButton href={reintentarUrl} marginBottom={14}>
        Reintentar mi pago →
      </CtaButton>
      <CtaButton href={whatsappUrl} variant="whatsapp">
        Resolverlo por WhatsApp
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
