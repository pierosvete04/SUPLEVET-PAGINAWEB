import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { brand, gradients } from "./brand";

// Bloque de piezas reutilizables para armar el cuerpo de cada correo,
// manteniendo siempre la misma tipografía de marca: Bebas Neue en
// titulares (mayúsculas), DM Sans en todo lo demás.

export function CategoryLabel({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "center";
}) {
  return (
    <Text
      style={{
        margin: "0 0 6px",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: ".1em",
        textTransform: "uppercase",
        color: brand.colors.orange,
        fontFamily: brand.fonts.body,
        textAlign: align,
      }}
    >
      {children}
    </Text>
  );
}

export function Headline({
  children,
  align = "left",
  color = brand.colors.navy,
}: {
  children: React.ReactNode;
  align?: "left" | "center";
  color?: string;
}) {
  return (
    <Text
      style={{
        margin: "0 0 14px",
        fontSize: 40,
        fontWeight: 400,
        color,
        lineHeight: 1.05,
        letterSpacing: "0.03em",
        fontFamily: brand.fonts.headline,
        textTransform: "uppercase",
        textAlign: align,
      }}
    >
      {children}
    </Text>
  );
}

export function BodyText({
  children,
  align = "left",
  marginBottom = 32,
}: {
  children: React.ReactNode;
  align?: "left" | "center";
  marginBottom?: number;
}) {
  return (
    <Text
      style={{
        margin: `0 0 ${marginBottom}px`,
        fontSize: 14.5,
        color: brand.colors.textMuted,
        lineHeight: 1.65,
        fontFamily: brand.fonts.body,
        textAlign: align,
      }}
    >
      {children}
    </Text>
  );
}

export function CtaButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
}) {
  const isPrimary = variant === "primary";
  return (
    <Section style={{ textAlign: "center", marginBottom: 28 }}>
      <Button
        href={href}
        style={{
          display: "inline-block",
          background: isPrimary
            ? `linear-gradient(135deg,${brand.colors.orange},${brand.colors.orangeDark})`
            : "transparent",
          border: isPrimary ? "none" : `2px solid ${brand.colors.navy}`,
          color: isPrimary ? "#ffffff" : brand.colors.navy,
          fontFamily: brand.fonts.body,
          fontSize: 15,
          fontWeight: 700,
          padding: isPrimary ? "16px 44px" : "14px 42px",
          borderRadius: 12,
          letterSpacing: ".02em",
          textDecoration: "none",
        }}
      >
        {children}
      </Button>
    </Section>
  );
}

// Banner oscuro para destacar un número/estado importante — mismo tratamiento
// visual que el bloque de nivel en 7-subida-nivel.html.
export function DarkBanner({
  eyebrow,
  value,
  caption,
}: {
  eyebrow: string;
  value: React.ReactNode;
  caption?: React.ReactNode;
}) {
  return (
    <Section
      style={{
        background: gradients.sky,
        borderRadius: 14,
        padding: 24,
        textAlign: "center",
        marginBottom: 32,
      }}
    >
      <Text
        style={{
          margin: "0 0 4px",
          fontSize: 13,
          color: "rgba(255,255,255,.85)",
          fontFamily: brand.fonts.body,
        }}
      >
        {eyebrow}
      </Text>
      <Text
        style={{
          margin: "0 0 4px",
          fontSize: 40,
          fontWeight: 400,
          color: "#ffffff",
          letterSpacing: "0.04em",
          fontFamily: brand.fonts.headline,
        }}
      >
        {value}
      </Text>
      {caption ? (
        <Text
          style={{
            margin: 0,
            fontSize: 12.5,
            color: "rgba(255,255,255,.85)",
            fontFamily: brand.fonts.body,
          }}
        >
          {caption}
        </Text>
      ) : null}
    </Section>
  );
}

// Tarjeta tipo "ticket" con borde punteado para códigos de cupón/canje —
// mismo tratamiento visual que el código de referido en 4-bienvenida.html.
export function TicketCode({
  label,
  code,
  note,
}: {
  label: string;
  code: string;
  note?: string;
}) {
  return (
    <Section
      style={{
        border: `2px dashed ${brand.colors.orange}`,
        borderRadius: 14,
        padding: "24px 20px",
        textAlign: "center",
        marginBottom: 32,
        backgroundColor: brand.colors.softGray,
      }}
    >
      <Text
        style={{
          margin: "0 0 12px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          color: brand.colors.textFaint,
          fontFamily: brand.fonts.body,
        }}
      >
        {label}
      </Text>
      <table role="presentation" cellPadding={0} cellSpacing={0} style={{ margin: "0 auto" }}>
        <tbody>
          <tr>
            <td
              style={{
                background: brand.colors.skyDeep,
                borderRadius: 10,
                padding: "12px 24px",
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: ".12em",
                  fontFamily: brand.fonts.mono,
                }}
              >
                {code}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      {note ? (
        <Text
          style={{
            margin: "12px 0 0",
            fontSize: 12,
            color: brand.colors.textFaint,
            fontFamily: brand.fonts.body,
          }}
        >
          {note}
        </Text>
      ) : null}
    </Section>
  );
}

export interface Step {
  title: string;
  description: string;
}

// Lista de pasos numerados — mismo tratamiento visual que "Empieza por aquí"
// en 4-bienvenida.html.
export function StepsList({ title, steps }: { title: string; steps: Step[] }) {
  return (
    <Section
      style={{
        backgroundColor: brand.colors.softGray,
        borderRadius: 14,
        padding: "20px 22px",
        marginBottom: 32,
      }}
    >
      <Text
        style={{
          margin: "0 0 14px",
          fontSize: 12,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".08em",
          color: brand.colors.textFaint,
          fontFamily: brand.fonts.body,
        }}
      >
        {title}
      </Text>
      {steps.map((step, i) => (
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          key={step.title}
          style={{ marginBottom: i === steps.length - 1 ? 0 : 12 }}
        >
          <tbody>
            <tr>
              <td width={36} valign="top">
                <div
                  style={{
                    width: 28,
                    height: 28,
                    background: brand.colors.skyDeep,
                    borderRadius: 8,
                    textAlign: "center",
                    lineHeight: "28px",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#ffffff",
                    fontFamily: brand.fonts.body,
                  }}
                >
                  {i + 1}
                </div>
              </td>
              <td style={{ paddingLeft: 10 }}>
                <Text
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: brand.colors.navy,
                    fontFamily: brand.fonts.body,
                  }}
                >
                  {step.title}
                </Text>
                <Text
                  style={{
                    margin: "2px 0 0",
                    fontSize: 12,
                    color: brand.colors.textMuted,
                    fontFamily: brand.fonts.body,
                  }}
                >
                  {step.description}
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      ))}
    </Section>
  );
}

export function Divider() {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: 24 }}>
      <tbody>
        <tr>
          <td style={{ borderTop: `1px solid ${brand.colors.border}`, fontSize: 0, lineHeight: 0 }}>&nbsp;</td>
        </tr>
      </tbody>
    </table>
  );
}

// Bloque grande para códigos OTP (login/verificación). El HTML de correo no
// puede ejecutar JS, así que no hay un botón "copiar" real que funcione en
// Gmail/Outlook/Apple Mail — en su lugar el código se muestra grande,
// monoespaciado y con separación entre caracteres para que sea fácil de
// seleccionar con doble tap / doble clic, con un ícono que lo deja claro.
export function OtpCodeBlock({ code, caption }: { code: string; caption?: string }) {
  return (
    <Section style={{ marginBottom: 36 }}>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
        <tbody>
          <tr>
            <td
              style={{
                background: gradients.sky,
                borderRadius: 16,
                padding: "30px 24px",
                textAlign: "center",
              }}
            >
              <Text
                style={{
                  margin: "0 0 4px",
                  fontSize: 48,
                  fontWeight: 700,
                  letterSpacing: "0.25em",
                  color: "#ffffff",
                  fontFamily: brand.fonts.mono,
                }}
              >
                {code}
              </Text>
              <Text
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "rgba(255,255,255,.85)",
                  fontFamily: brand.fonts.body,
                  letterSpacing: ".03em",
                }}
              >
                📋 Mantén presionado el código para copiarlo
              </Text>
              {caption ? (
                <Text
                  style={{
                    margin: "6px 0 0",
                    fontSize: 11,
                    color: "rgba(255,255,255,.6)",
                    fontFamily: brand.fonts.body,
                  }}
                >
                  {caption}
                </Text>
              ) : null}
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

// Nota de seguridad con candado — usada en los 3 correos de autenticación.
export function SecurityNote({ children }: { children: React.ReactNode }) {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
      <tbody>
        <tr>
          <td width={20} valign="top" style={{ paddingTop: 1 }}>
            <span style={{ fontSize: 14 }}>🔒</span>
          </td>
          <td style={{ paddingLeft: 10 }}>
            <Text
              style={{
                margin: 0,
                fontSize: 12.5,
                color: brand.colors.textFaint,
                lineHeight: 1.6,
                fontFamily: brand.fonts.body,
              }}
            >
              {children}
            </Text>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// Enlace de respaldo en texto plano, por si el botón CTA no funciona en el
// cliente de correo del usuario.
export function FallbackLinkBox({ url }: { url: string }) {
  return (
    <Section
      style={{
        backgroundColor: brand.colors.softGray,
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 32,
      }}
    >
      <Text
        style={{
          margin: "0 0 6px",
          fontSize: 11.5,
          color: brand.colors.textFaint,
          fontFamily: brand.fonts.body,
        }}
      >
        Si el botón no funciona, copia este enlace:
      </Text>
      <Text
        style={{
          margin: 0,
          fontSize: 11,
          color: brand.colors.textMuted,
          fontFamily: brand.fonts.mono,
          wordBreak: "break-all",
          lineHeight: 1.5,
        }}
      >
        {url}
      </Text>
    </Section>
  );
}
