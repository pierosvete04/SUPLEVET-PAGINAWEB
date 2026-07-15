import * as React from "react";
import { brand, gradients } from "./components/brand";
import { EmailLayout } from "./components/EmailLayout";
import { BodyText, CategoryLabel, CtaButton, Headline, StepsList } from "./components/primitives";

export interface PagoEnVerificacionProps {
  nombre: string;
  numeroPedido: string;
  metodoPago: "Yape" | "Plin" | "transferencia" | "tarjeta";
  whatsappUrl?: string;
}

export default function PagoEnVerificacion({
  nombre = "Juan",
  numeroPedido = "W-1001",
  metodoPago = "Yape",
  whatsappUrl = "https://wa.me/51999999999",
}: PagoEnVerificacionProps) {
  const textoMetodo = metodoPago === "tarjeta" ? "el comprobante de tu pago" : `tu voucher de ${metodoPago}`;
  return (
    <EmailLayout
      previewText={`Estamos validando tu pago del pedido #${numeroPedido}`}
      stripeGradient={gradients.warn}
    >
      <CategoryLabel>En verificación</CategoryLabel>
      <Headline>Estamos validando tu pago, {nombre}</Headline>
      <BodyText>
        Recibimos tu pedido <strong style={{ color: brand.colors.navy }}>#{numeroPedido}</strong>.
        Para confirmarlo, envíanos {textoMetodo} respondiendo este mismo correo o por WhatsApp.
      </BodyText>

      <StepsList
        title="Cómo proceder"
        steps={[
          {
            title: "Envía tu voucher",
            description: "Comparte la captura de tu transferencia exitosa por WhatsApp.",
          },
          {
            title: "Lo validamos",
            description: "Nuestro equipo verifica la transacción en minutos.",
          },
          {
            title: "Te confirmamos por correo",
            description: "Recibirás la confirmación con los detalles de tu envío.",
          },
        ]}
      />

      <CtaButton href={whatsappUrl}>Enviar voucher por WhatsApp →</CtaButton>

      <BodyText marginBottom={0}>
        Si ya enviaste tu comprobante, ignora este mensaje — ya lo estamos procesando.
      </BodyText>
    </EmailLayout>
  );
}
