import * as React from "react";
import { brand, gradients } from "./components/brand";
import { EmailLayout } from "./components/EmailLayout";
import { BodyText, CategoryLabel, CtaButton, Headline, TicketCode } from "./components/primitives";

export interface CanjeConfirmadoProps {
  nombre: string;
  nombreCanje: string;
  puntosUsados: number;
  codigoCanje: string;
  vigenciaDias?: number;
  portalUrl?: string;
}

export default function CanjeConfirmado({
  nombre = "Juan",
  nombreCanje = "Cupón de descuento",
  puntosUsados = 500,
  codigoCanje = "NUTRIVET-2024",
  vigenciaDias = 30,
  portalUrl = `${brand.portalUrl}/puntos`,
}: CanjeConfirmadoProps) {
  return (
    <EmailLayout previewText={`Tu canje fue exitoso — ${nombreCanje}`} stripeGradient={gradients.pinkOrange}>
      <CategoryLabel>🎁 Canje confirmado</CategoryLabel>
      <Headline>
        ¡Listo, {nombre}!
        <br />
        Canjeaste {nombreCanje}
      </Headline>
      <BodyText>
        Usaste <strong style={{ color: brand.colors.navy }}>{puntosUsados} SuplePoints</strong> para
        canjear {nombreCanje}. Tu código está listo para usar en tu próxima compra.
      </BodyText>

      <TicketCode
        label="Código de canje"
        code={codigoCanje}
        note={`Válido por ${vigenciaDias} días. Aplican términos y condiciones.`}
      />

      <CtaButton href={portalUrl}>Ver mi historial de canjes →</CtaButton>
    </EmailLayout>
  );
}
