import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { brand, gradients } from "./brand";

// Se aplica en el <body> y además en la tabla exterior: Gmail descarta parte de
// los estilos del <body>, así que sin el duplicado el patrón desaparece ahí.
// `backgroundColor` va siempre junto a la imagen como respaldo para clientes que
// bloquean imágenes remotas.
const canvasBackground = {
  backgroundColor: brand.colors.canvas,
  backgroundImage: `url(${brand.pawTileUrl})`,
  backgroundRepeat: "repeat",
} as const;

interface EmailLayoutProps {
  previewText: string;
  /** Gradiente de la franja de 5px arriba de la tarjeta. Ver `gradients` en brand.ts. */
  stripeGradient?: string;
  children: React.ReactNode;
}

// Envoltorio compartido por todos los correos: lienzo blanco, columna navy
// centrada del ancho del contenido, y dentro de ella el logo, la tarjeta blanca
// con franja de color, y el footer.
//
// El navy vive en la columna interna y NO en el <Body> a propósito: así los
// costados del correo quedan blancos y la marca se lee como una pieza vertical
// centrada. Nota para Outlook (motor Word): ignora border-radius, así que ahí
// la columna se ve con esquinas rectas — el resto del diseño no cambia.
export function EmailLayout({
  previewText,
  stripeGradient = gradients.orange,
  children,
}: EmailLayoutProps) {
  return (
    <Html lang="es">
      <Head>
        <link href={brand.googleFontsHref} rel="stylesheet" />
      </Head>
      <Preview>{previewText}</Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          ...canvasBackground,
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <Section style={{ padding: "48px 16px", ...canvasBackground }}>
          <Container style={{ maxWidth: 520, margin: "0 auto" }}>
            <Section
              style={{
                backgroundColor: brand.colors.navy,
                borderRadius: 24,
                padding: "40px 16px 24px",
              }}
            >
              <Section style={{ textAlign: "center", paddingBottom: 32 }}>
                <Img
                  src={brand.logoUrl}
                  width="220"
                  alt="Suplevet"
                  style={{ display: "inline-block", maxWidth: 220, border: "0" }}
                />
              </Section>

              <Section
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 20,
                  overflow: "hidden",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
                }}
              >
                <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                  <tbody>
                    <tr>
                      <td
                        style={{
                          background: stripeGradient,
                          height: 5,
                          fontSize: 0,
                          lineHeight: 0,
                        }}
                      >
                        &nbsp;
                      </td>
                    </tr>
                  </tbody>
                </table>
                <Section style={{ padding: "40px 36px 36px" }}>{children}</Section>
              </Section>

              <Footer />
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}

function Footer() {
  const socials = [
    brand.social.facebook,
    brand.social.whatsapp,
    brand.social.instagram,
    brand.social.tiktok,
  ];

  return (
    <Section style={{ padding: "32px 8px 8px", textAlign: "center" }}>
      <Section style={{ paddingBottom: 20 }}>
        {socials.map((social) => (
          <Link
            key={social.url}
            href={social.url}
            style={{ display: "inline-block", margin: "0 8px" }}
          >
            <Img
              src={social.icon}
              width="20"
              height="20"
              alt={social.label}
              style={{ display: "inline-block", border: "0" }}
            />
          </Link>
        ))}
      </Section>

      <Text
        style={{
          margin: "0 0 8px",
          fontSize: 12,
          color: "rgba(255,255,255,.45)",
          fontFamily: brand.fonts.body,
          lineHeight: 1.6,
        }}
      >
        Suplevet · Nutrición y cuidado para tu mascota
      </Text>
      <Text style={{ margin: 0, fontSize: 12, fontFamily: brand.fonts.body }}>
        <Link href={brand.siteUrl} style={{ color: brand.colors.orange, textDecoration: "none" }}>
          suplevet.pe
        </Link>
        <span style={{ color: "rgba(255,255,255,.2)" }}>&nbsp;·&nbsp;</span>
        <Link href={brand.portalUrl} style={{ color: brand.colors.orange, textDecoration: "none" }}>
          Portal de Clientes
        </Link>
      </Text>
    </Section>
  );
}
