import * as React from "react";
import { brand, gradients } from "./components/brand";
import { EmailLayout } from "./components/EmailLayout";
import {
  BodyText,
  CategoryLabel,
  CtaButton,
  DarkBanner,
  Headline,
  WhatsAppCard,
} from "./components/primitives";

export interface PagoConfirmadoProps {
  nombre: string;
  numeroPedido: string;
  puntosGanados?: number;
  tiempoEstimadoEnvio?: string;
  portalUrl?: string;
  whatsappUrl?: string;
}

export default function PagoConfirmado({
  nombre = "Juan",
  numeroPedido = "W-1001",
  puntosGanados = 150,
  tiempoEstimadoEnvio = "2 a 4 días hábiles",
  portalUrl = `${brand.portalUrl}/pedidos`,
  whatsappUrl = "https://wa.me/51999999999",
}: PagoConfirmadoProps) {
  return (
    <EmailLayout previewText={`¡Tu pago fue confirmado! Pedido #${numeroPedido}`} stripeGradient={gradients.green}>
      <CategoryLabel align="center">🎉 Pago confirmado</CategoryLabel>
      <Headline align="center">
        ¡Listo, {nombre}!
        <br />
        Tu pago fue confirmado
      </Headline>
      <BodyText align="center">
        Tu pedido <strong style={{ color: brand.colors.navy }}>#{numeroPedido}</strong> ya está
        confirmado y pasa a preparación
        {puntosGanados > 0 ? ". Ganaste SuplePoints con esta compra 🐾" : " 🐾"}
      </BodyText>

      {puntosGanados > 0 && (
        <DarkBanner
          eyebrow="Recompensa obtenida"
          value={`+${puntosGanados} SuplePoints`}
          caption={`Se sumaron a tu cuenta. Envío estimado: ${tiempoEstimadoEnvio}.`}
        />
      )}

      {whatsappUrl ? (
        <WhatsAppCard
          title="¿Quieres saber cuándo te llega?"
          description="Escríbenos por WhatsApp y te contamos el estado de tu envío al toque."
          whatsappUrl={whatsappUrl}
        />
      ) : null}

      <CtaButton href={portalUrl}>Ver mi pedido →</CtaButton>
    </EmailLayout>
  );
}
