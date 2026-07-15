import { Img, Section, Text } from "@react-email/components";
import * as React from "react";
import { brand, gradients } from "./components/brand";
import { EmailLayout } from "./components/EmailLayout";
import { BodyText, CategoryLabel, CtaButton, Headline } from "./components/primitives";

export interface CarritoAbandonadoProps {
  nombre: string;
  producto: {
    nombre: string;
    cantidad: number;
    precio: number;
    /** URL real del producto — mismo campo `imagen` que usa productos_web en Supabase. */
    imagenUrl: string;
  };
  stockLimitado?: boolean;
  codigoIncentivo?: string;
  checkoutUrl?: string;
}

const fmt = (n: number) => `S/.${n.toFixed(2)}`;

const features = [
  { icon: "🔬", label: "Respaldo científico" },
  { icon: "🩺", label: "Fórmula veterinaria" },
  { icon: "🇵🇪", label: "Hecho en Perú" },
];

export default function CarritoAbandonado({
  nombre = "Juan",
  producto = {
    nombre: "Suplevet Nutrición Avanzada 150g",
    cantidad: 1,
    precio: 99.9,
    imagenUrl: "https://suplevet.pe/images/comparativa/bolsa-150g-posterior.png",
  },
  stockLimitado = true,
  codigoIncentivo,
  checkoutUrl = `${brand.siteUrl}/carrito`,
}: CarritoAbandonadoProps) {
  return (
    <EmailLayout previewText={`${nombre}, dejaste algo en tu carrito`} stripeGradient={gradients.orange}>
      <CategoryLabel>Tu carrito te espera</CategoryLabel>
      <Headline>¿Se te olvidó algo, {nombre}?</Headline>
      <BodyText>
        Notamos que dejaste un producto en tu carrito. La nutrición de tu mascota es importante
        para nosotros: Suplevet ayuda desde el interior, fortaleciendo el sistema inmune, mejorando
        la digestión y dándole un pelaje radiante.
      </BodyText>

      <Section
        style={{
          border: `1px solid ${brand.colors.border}`,
          borderRadius: 14,
          padding: 20,
          marginBottom: 24,
          position: "relative",
        }}
      >
        {stockLimitado ? (
          <Text
            style={{
              display: "inline-block",
              margin: "0 0 12px",
              fontSize: 11,
              fontWeight: 700,
              color: "#ffffff",
              backgroundColor: brand.colors.error,
              padding: "4px 10px",
              borderRadius: 99,
              fontFamily: brand.fonts.body,
            }}
          >
            Stock limitado
          </Text>
        ) : null}

        <Section style={{ textAlign: "center", marginBottom: 16 }}>
          <Img
            src={producto.imagenUrl}
            width="180"
            alt={producto.nombre}
            style={{ margin: "0 auto", maxWidth: 180, height: "auto", display: "block" }}
          />
        </Section>

        <Text style={{ margin: 0, fontSize: 15, fontWeight: 700, color: brand.colors.navy, fontFamily: brand.fonts.body, textAlign: "center" }}>
          {producto.nombre}
        </Text>
        <Text style={{ margin: "2px 0 0", fontSize: 12, color: brand.colors.textMuted, fontFamily: brand.fonts.body, textAlign: "center" }}>
          Cantidad: {producto.cantidad}
        </Text>
        <Text style={{ margin: "6px 0 0", fontSize: 18, fontWeight: 800, color: brand.colors.orange, fontFamily: brand.fonts.body, textAlign: "center" }}>
          {fmt(producto.precio)}
        </Text>

        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ marginTop: 16, borderTop: `1px solid ${brand.colors.border}`, paddingTop: 14 }}>
          <tbody>
            <tr>
              {features.map((f) => (
                <td key={f.label} align="center" style={{ width: `${100 / features.length}%` }}>
                  <Text style={{ margin: "0 0 2px", fontSize: 20 }}>{f.icon}</Text>
                  <Text style={{ margin: 0, fontSize: 10.5, color: brand.colors.textMuted, fontFamily: brand.fonts.body }}>
                    {f.label}
                  </Text>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </Section>

      {codigoIncentivo ? (
        <BodyText align="center" marginBottom={20}>
          Usa el código{" "}
          <strong style={{ color: brand.colors.orange }}>{codigoIncentivo}</strong> en tu próxima
          compra.
        </BodyText>
      ) : null}

      <CtaButton href={checkoutUrl}>Completar mi compra →</CtaButton>

      <BodyText marginBottom={0} align="center">
        ¿Tienes dudas? Escríbenos a{" "}
        <a href={`mailto:${brand.supportEmail}`} style={{ color: brand.colors.orange }}>
          {brand.supportEmail}
        </a>
        .
      </BodyText>
    </EmailLayout>
  );
}
