import * as React from "react";
import { brand, gradients } from "./components/brand";
import { EmailLayout } from "./components/EmailLayout";
import { BodyText, CategoryLabel, CtaButton, DarkBanner, Headline } from "./components/primitives";

export interface SuplepointsAcreditadosProps {
  nombre: string;
  puntosGanados: number;
  saldoAnterior: number;
  saldoNuevo: number;
  origen: string;
  portalUrl?: string;
}

export default function SuplepointsAcreditados({
  nombre = "Juan",
  puntosGanados = 100,
  saldoAnterior = 450,
  saldoNuevo = 550,
  origen = "tu compra en suplevet.pe",
  portalUrl = `${brand.portalUrl}/puntos`,
}: SuplepointsAcreditadosProps) {
  return (
    <EmailLayout
      previewText={`+${puntosGanados} SuplePoints acreditados a tu cuenta`}
      stripeGradient={gradients.orange}
    >
      <CategoryLabel align="center">SuplePoints</CategoryLabel>
      <Headline align="center">
        ¡Ganaste {puntosGanados} puntos, {nombre}!
      </Headline>
      <BodyText align="center">
        Por {origen} acreditamos {puntosGanados} SuplePoints a tu cuenta. Ya están listos para
        canjearse por descuentos y beneficios. 🐾
      </BodyText>

      <DarkBanner
        eyebrow="Tu nuevo saldo"
        value={
          <>
            <span style={{ textDecoration: "line-through", opacity: 0.5, fontSize: 24 }}>
              {saldoAnterior}
            </span>{" "}
            → {saldoNuevo} pts
          </>
        }
      />

      <CtaButton href={portalUrl}>Ver mis puntos →</CtaButton>
    </EmailLayout>
  );
}
