import { Section } from "@react-email/components";
import * as React from "react";
import { brand, gradients } from "./components/brand";
import { EmailLayout } from "./components/EmailLayout";
import { BodyText, CategoryLabel, CtaButton, Divider, Headline } from "./components/primitives";

export interface PedidoDevueltoProps {
  nombre: string;
  numeroPedido: string;
  motivo?: string;
  whatsappUrl?: string;
}

export default function PedidoDevuelto({
  nombre = "Juan",
  numeroPedido = "W-1001",
  motivo = "no se pudo completar la entrega",
  whatsappUrl = "https://wa.me/51999999999",
}: PedidoDevueltoProps) {
  return (
    <EmailLayout
      previewText={`Tu pedido #${numeroPedido} fue devuelto`}
      stripeGradient={gradients.warn}
    >
      <CategoryLabel>Pedido devuelto</CategoryLabel>
      <Headline>Tu pedido volvió a nuestro almacén, {nombre}</Headline>
      <BodyText>
        Tu pedido <strong style={{ color: brand.colors.navy }}>#{numeroPedido}</strong> fue
        registrado como devuelto: {motivo}. Escríbenos para coordinar un reenvío o el siguiente
        paso.
      </BodyText>

      <Section style={{ marginBottom: 8 }}>
        <CtaButton href={whatsappUrl}>Escribir por WhatsApp →</CtaButton>
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
