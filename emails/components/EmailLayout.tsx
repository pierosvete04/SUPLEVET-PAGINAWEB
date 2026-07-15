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

interface EmailLayoutProps {
  previewText: string;
  /** Gradiente de la franja de 5px arriba de la tarjeta. Ver `gradients` en brand.ts. */
  stripeGradient?: string;
  children: React.ReactNode;
}

// Envoltorio compartido por todos los correos: fondo navy, logo, tarjeta blanca
// con franja de color, y footer — igual a la estructura ya usada en los 7
// correos de PORTAL DE CLIENTES/email-templates/*.html, pero como componente
// reutilizable en vez de HTML repetido en cada archivo.
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
          backgroundColor: brand.colors.navy,
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <Section style={{ padding: "48px 16px" }}>
          <Container style={{ maxWidth: 520, margin: "0 auto" }}>
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
              <Section style={{ padding: "44px 44px 40px" }}>{children}</Section>
            </Section>

            <Footer />
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
      <table role="presentation" cellPadding={0} cellSpacing={0} style={{ margin: "0 auto 20px" }}>
        <tbody>
          <tr>
            {socials.map((social, i) => (
              <td key={social.url} style={{ paddingLeft: i === 0 ? 0 : 12 }}>
                <Link href={social.url}>
                  <Img
                    src={social.icon}
                    width="28"
                    height="28"
                    alt=""
                    style={{ borderRadius: "50%", display: "block" }}
                  />
                </Link>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

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
