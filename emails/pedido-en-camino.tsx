import * as React from "react";
import { brand, gradients } from "./components/brand";
import { EmailLayout } from "./components/EmailLayout";
import { BodyText, CategoryLabel, CtaButton, Headline } from "./components/primitives";

export interface PedidoEnCaminoProps {
  nombre: string;
  numeroPedido: string;
  portalUrl?: string;
}

export default function PedidoEnCamino({
  nombre = "Juan",
  numeroPedido = "W-1001",
  portalUrl = `${brand.portalUrl}/pedidos`,
}: PedidoEnCaminoProps) {
  return (
    <EmailLayout
      previewText={`¡Tu pedido #${numeroPedido} está en camino!`}
      stripeGradient={gradients.sky}
    >
      <CategoryLabel>Pedido en camino</CategoryLabel>
      <Headline>
        ¡Ya salió, {nombre}!
        <br />
        Tu pedido está en camino
      </Headline>
      <BodyText>
        Tu pedido <strong style={{ color: brand.colors.navy }}>#{numeroPedido}</strong> quedó listo
        y ya va rumbo a tu dirección. Cualquier duda sobre el envío, escríbenos por WhatsApp.
      </BodyText>

      <CtaButton href={portalUrl}>Ver mi pedido →</CtaButton>
    </EmailLayout>
  );
}
