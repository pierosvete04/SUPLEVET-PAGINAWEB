import { Section, Text } from "@react-email/components";
import * as React from "react";
import { brand, gradients } from "./components/brand";
import { EmailLayout } from "./components/EmailLayout";
import { BodyText, CategoryLabel, Divider, Headline, TicketCode } from "./components/primitives";

export interface LibroReclamacionRespondidoProps {
  nombre: string;
  correlativo: string;
  tipoSolicitud: "reclamo" | "queja";
  respuesta: string;
}

export default function LibroReclamacionRespondido({
  nombre = "Juan",
  correlativo = "2026-000001",
  tipoSolicitud = "reclamo",
  respuesta = "Hemos revisado tu caso y coordinamos el reenvío del producto.",
}: LibroReclamacionRespondidoProps) {
  const etiqueta = tipoSolicitud === "queja" ? "queja" : "reclamo";

  return (
    <EmailLayout
      previewText={`Respondimos tu ${etiqueta} #${correlativo}`}
      stripeGradient={gradients.warn}
    >
      <CategoryLabel>Libro de reclamaciones</CategoryLabel>
      <Headline>Respondimos tu {etiqueta}, {nombre}</Headline>
      <BodyText>
        Este es el resultado de la revisión de tu {etiqueta} registrado en nuestro libro de
        reclamaciones, conforme al plazo establecido por la Ley N.° 29571.
      </BodyText>

      <TicketCode label="N.° de reclamo" code={correlativo} />

      <Section
        style={{
          marginBottom: 32,
          padding: 16,
          borderRadius: 12,
          backgroundColor: brand.colors.softGray,
          border: `1px solid ${brand.colors.border}`,
        }}
      >
        <Text
          style={{
            margin: 0,
            fontSize: 14.5,
            color: brand.colors.textMuted,
            lineHeight: 1.65,
            fontFamily: brand.fonts.body,
            whiteSpace: "pre-wrap",
          }}
        >
          {respuesta}
        </Text>
      </Section>

      <Divider />
      <BodyText marginBottom={0}>
        ¿Tienes dudas sobre esta respuesta? Escríbenos a{" "}
        <a href={`mailto:${brand.supportEmail}`} style={{ color: brand.colors.orange }}>
          {brand.supportEmail}
        </a>
        .
      </BodyText>
    </EmailLayout>
  );
}
