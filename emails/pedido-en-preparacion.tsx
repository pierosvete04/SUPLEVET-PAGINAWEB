import * as React from "react";
import { brand, gradients } from "./components/brand";
import { EmailLayout } from "./components/EmailLayout";
import { BodyText, CategoryLabel, CtaButton, Headline } from "./components/primitives";

export interface PedidoEnPreparacionProps {
  nombre: string;
  numeroPedido: string;
  portalUrl?: string;
}

export default function PedidoEnPreparacion({
  nombre = "Juan",
  numeroPedido = "W-1001",
  portalUrl = `${brand.portalUrl}/pedidos`,
}: PedidoEnPreparacionProps) {
  return (
    <EmailLayout
      previewText={`Estamos preparando tu pedido #${numeroPedido}`}
      stripeGradient={gradients.sky}
    >
      <CategoryLabel>Pedido en preparación</CategoryLabel>
      <Headline>
        ¡Manos a la obra, {nombre}!
        <br />
        Ya estamos alistando tu pedido
      </Headline>
      <BodyText>
        Tu pedido <strong style={{ color: brand.colors.navy }}>#{numeroPedido}</strong> está siendo
        preparado en nuestro almacén. Te avisaremos apenas quede listo para el envío.
      </BodyText>

      <CtaButton href={portalUrl}>Ver mi pedido →</CtaButton>
    </EmailLayout>
  );
}
