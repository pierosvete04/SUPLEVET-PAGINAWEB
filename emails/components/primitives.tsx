import { Button, Img, Section, Text } from "@react-email/components";
import * as React from "react";
import { brand, gradients, icons, shadows, type EmailIconName } from "./brand";

// Bloque de piezas reutilizables para armar el cuerpo de cada correo,
// manteniendo siempre la misma tipografía de marca: Bebas Neue en
// titulares (mayúsculas), DM Sans en todo lo demás.

// Ícono PNG alineado al texto. Nunca emojis: se dibujan distinto en cada
// sistema operativo y no se pueden teñir con los colores de marca. Ver el
// bloque `icons` en brand.ts para el catálogo y el porqué del formato.
export function EmailIcon({
  name,
  align = "middle",
  marginRight = 0,
}: {
  name: EmailIconName;
  align?: "middle" | "top" | "baseline";
  marginRight?: number;
}) {
  const icon = icons[name];
  return (
    <Img
      src={icon.src}
      width={icon.size}
      height={icon.size}
      alt={icon.alt}
      style={{
        display: "inline-block",
        verticalAlign: align,
        border: "0",
        marginRight,
      }}
    />
  );
}

export function CategoryLabel({
  children,
  align = "left",
  icon,
}: {
  children: React.ReactNode;
  align?: "left" | "center";
  icon?: EmailIconName;
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
      {icon ? <EmailIcon name={icon} marginRight={7} /> : null}
      {children}
    </Text>
  );
}

// `lg` (40px) es el titular por defecto; `md` (32px) es para titulares que
// pasan de dos líneas — a 40px de Bebas una frase larga se come el aire de la
// tarjeta y deja de leerse como titular.
const HEADLINE_SIZES = { lg: 40, md: 32 } as const;

export function Headline({
  children,
  align = "left",
  color = brand.colors.navy,
  size = "lg",
}: {
  children: React.ReactNode;
  align?: "left" | "center";
  color?: string;
  size?: keyof typeof HEADLINE_SIZES;
}) {
  return (
    <Text
      style={{
        margin: "0 0 14px",
        fontSize: HEADLINE_SIZES[size],
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

// Variantes del CTA. Reglas que aplican a todas:
//
// 1. `backgroundColor` y `backgroundImage` van SEPARADOS, nunca con el
//    shorthand `background`. Outlook de escritorio (motor Word) descarta los
//    degradados: con el shorthand el botón se quedaba sin fondo y el texto
//    blanco terminaba invisible sobre blanco. Con el par, Outlook cae al color
//    sólido, que además es el extremo OSCURO del degradado (el que sostiene el
//    contraste del texto).
// 2. La sombra lleva el color del propio botón, no gris — es lo que lo despega
//    de la tarjeta. Outlook la ignora y degrada a plano sin romper nada.
// 3. `whatsapp` lleva el glifo de la app, así la acción se reconoce por forma y
//    no solo por el color verde (regla color-not-only de accesibilidad).
const CTA_VARIANTS = {
  primary: {
    backgroundColor: brand.colors.orangeDark,
    backgroundImage: `linear-gradient(135deg,${brand.colors.orange},${brand.colors.orangeDark})`,
    color: "#ffffff",
    border: "none",
    boxShadow: shadows.ctaOrange,
    padding: "16px 44px",
    icon: undefined,
  },
  whatsapp: {
    backgroundColor: brand.colors.whatsappDark,
    backgroundImage: gradients.whatsapp,
    color: "#ffffff",
    border: "none",
    boxShadow: shadows.ctaWhatsapp,
    padding: "16px 38px",
    icon: "whatsapp",
  },
  outline: {
    backgroundColor: "transparent",
    backgroundImage: "none",
    color: brand.colors.navy,
    border: `2px solid ${brand.colors.navy}`,
    boxShadow: "none",
    padding: "14px 42px",
    icon: undefined,
  },
} as const;

export type CtaVariant = keyof typeof CTA_VARIANTS;

export function CtaButton({
  href,
  children,
  variant = "primary",
  marginBottom = 28,
}: {
  href: string;
  children: React.ReactNode;
  variant?: CtaVariant;
  marginBottom?: number;
}) {
  const v = CTA_VARIANTS[variant];
  return (
    <Section style={{ textAlign: "center", marginBottom }}>
      <Button
        href={href}
        style={{
          display: "inline-block",
          backgroundColor: v.backgroundColor,
          backgroundImage: v.backgroundImage,
          border: v.border,
          color: v.color,
          fontFamily: brand.fonts.body,
          fontSize: 15,
          fontWeight: 700,
          padding: v.padding,
          borderRadius: 12,
          letterSpacing: ".02em",
          textDecoration: "none",
          boxShadow: v.boxShadow,
        }}
      >
        {v.icon ? <EmailIcon name={v.icon} marginRight={9} /> : null}
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
        boxShadow: shadows.raised,
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
        border: `1px solid ${brand.colors.border}`,
        borderRadius: 14,
        padding: "20px 22px",
        marginBottom: 32,
        boxShadow: shadows.raised,
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
                <EmailIcon name="clipboard" marginRight={7} />
                Mantén presionado el código para copiarlo
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
          <td width={20} valign="top" style={{ paddingTop: 2 }}>
            <EmailIcon name="lock" align="top" />
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

// Tarjeta de WhatsApp con botón, mismo tratamiento visual (borde punteado)
// que el bloque "Confirma tu pedido por WhatsApp" de
// app/checkout/exito/page.tsx — la idea es que el cliente sea quien escribe
// primero, así la conversación entra como iniciada por el usuario (más barata
// que una conversación iniciada por el negocio en WhatsApp Business API).
// Sin QR: los clientes de correo (Gmail incluido) bloquean imágenes `data:`
// embebidas por seguridad, así que saldría rota — solo queda el botón.
export function WhatsAppCard({
  title,
  description,
  whatsappUrl,
  buttonLabel = "Escribir por WhatsApp",
}: {
  title: string;
  description: string;
  whatsappUrl: string;
  buttonLabel?: string;
}) {
  return (
    <Section
      style={{
        border: `2px dashed ${brand.colors.orange}`,
        borderRadius: 14,
        padding: "20px 22px",
        marginBottom: 32,
        backgroundColor: brand.colors.softGray,
        textAlign: "center",
        boxShadow: shadows.raised,
      }}
    >
      <Text
        style={{
          margin: "0 0 4px",
          fontSize: 13.5,
          fontWeight: 700,
          color: brand.colors.navy,
          fontFamily: brand.fonts.body,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          margin: "0 0 18px",
          fontSize: 12.5,
          color: brand.colors.textMuted,
          fontFamily: brand.fonts.body,
        }}
      >
        {description}
      </Text>
      <CtaButton href={whatsappUrl} variant="whatsapp" marginBottom={4}>
        {buttonLabel}
      </CtaButton>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Barra de progreso del pedido
// ---------------------------------------------------------------------------

// Las 5 etapas del ciclo de vida de un pedido web, en orden. El orden importa:
// la barra pinta como completadas todas las que están ANTES de la actual.
export const ETAPAS_PEDIDO = [
  { id: "recibido", label: "Recibido" },
  { id: "pagado", label: "Pagado" },
  { id: "preparacion", label: "Preparando" },
  { id: "camino", label: "En camino" },
  { id: "entregado", label: "Entregado" },
] as const;

export type EtapaPedido = (typeof ETAPAS_PEDIDO)[number]["id"];

// `warn` = el pedido se salió del camino feliz (devuelto) y `error` = se cortó
// (cancelado/rechazado). Se pinta el segmento actual con ese color en vez del
// naranja, y el resto queda en gris para que se lea que no avanzó.
const PROGRESS_TONES = {
  normal: brand.colors.orange,
  warn: brand.colors.warn,
  error: brand.colors.error,
} as const;

/**
 * Barra segmentada que ubica al cliente dentro del ciclo del pedido. Es lo
 * primero que se ve en los correos de estado: responde "¿en qué voy?" sin que
 * el cliente tenga que leer nada.
 *
 * Se arma con una <table> de dos filas (barras / etiquetas) y celdas de color
 * plano — sin flex, sin border-radius y sin imágenes — porque es la única
 * construcción que se ve igual en Gmail, Apple Mail y Outlook de escritorio.
 */
export function OrderProgress({
  current,
  tone = "normal",
}: {
  current: EtapaPedido;
  tone?: keyof typeof PROGRESS_TONES;
}) {
  const activeIndex = ETAPAS_PEDIDO.findIndex((e) => e.id === current);
  const accent = PROGRESS_TONES[tone];
  const ancho = `${(100 / ETAPAS_PEDIDO.length).toFixed(2)}%`;

  return (
    <Section style={{ marginBottom: 30 }}>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
        <tbody>
          <tr>
            {ETAPAS_PEDIDO.map((etapa, i) => {
              const done = i < activeIndex;
              const isCurrent = i === activeIndex;
              return (
                <td
                  key={etapa.id}
                  width={ancho}
                  style={{ paddingRight: i === ETAPAS_PEDIDO.length - 1 ? 0 : 4 }}
                >
                  <div
                    style={{
                      height: 5,
                      fontSize: 0,
                      lineHeight: 0,
                      borderRadius: 3,
                      backgroundColor: done
                        ? brand.colors.orange
                        : isCurrent
                          ? accent
                          : "#E5E3DF",
                    }}
                  >
                    &nbsp;
                  </div>
                </td>
              );
            })}
          </tr>
          <tr>
            {ETAPAS_PEDIDO.map((etapa, i) => {
              const isCurrent = i === activeIndex;
              const done = i < activeIndex;
              return (
                <td
                  key={etapa.id}
                  width={ancho}
                  style={{ paddingTop: 7, paddingRight: i === ETAPAS_PEDIDO.length - 1 ? 0 : 4 }}
                >
                  <Text
                    style={{
                      margin: 0,
                      fontSize: 9.5,
                      lineHeight: 1.3,
                      letterSpacing: ".04em",
                      textTransform: "uppercase",
                      fontFamily: brand.fonts.body,
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent
                        ? brand.colors.navy
                        : done
                          ? brand.colors.textMuted
                          : brand.colors.textFaint,
                    }}
                  >
                    {etapa.label}
                  </Text>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Caja de estado (alerta)
// ---------------------------------------------------------------------------

// Cada tono trae ícono + color de borde + tinte de fondo. El ícono NO es
// decorativo: es lo que permite distinguir un error de una advertencia sin
// depender del color (regla color-not-only), por eso lleva `alt` en brand.ts.
const ALERT_TONES = {
  error: {
    icon: "alertErrorLg",
    accent: brand.colors.error,
    background: brand.colors.errorTint,
  },
  warn: {
    icon: "alertWarnLg",
    accent: brand.colors.warn,
    background: brand.colors.warnTint,
  },
  success: {
    icon: "alertSuccessLg",
    accent: brand.colors.success,
    background: brand.colors.successTint,
  },
  info: {
    icon: "alertInfoLg",
    accent: brand.colors.skyDeep,
    background: brand.colors.infoTint,
  },
} as const;

export type AlertTone = keyof typeof ALERT_TONES;

/**
 * Bloque para comunicar un estado que el cliente necesita entender antes de
 * actuar (un pago rechazado, un pedido devuelto, una confirmación).
 *
 * `title` da el hecho y `children` explica el siguiente paso — un mensaje de
 * error que no dice cómo salir de él no sirve de nada.
 */
export function AlertBox({
  tone,
  title,
  children,
}: {
  tone: AlertTone;
  title: string;
  children?: React.ReactNode;
}) {
  const t = ALERT_TONES[tone];
  return (
    <Section style={{ marginBottom: 28 }}>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
        <tbody>
          <tr>
            <td
              style={{
                backgroundColor: t.background,
                borderLeft: `4px solid ${t.accent}`,
                borderRadius: "0 12px 12px 0",
                padding: "16px 18px",
                boxShadow: shadows.raised,
              }}
            >
              <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                <tbody>
                  <tr>
                    <td width={30} valign="top" style={{ paddingTop: 1 }}>
                      <EmailIcon name={t.icon} align="top" />
                    </td>
                    <td valign="top">
                      <Text
                        style={{
                          margin: 0,
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: brand.colors.navy,
                          lineHeight: 1.4,
                          fontFamily: brand.fonts.body,
                        }}
                      >
                        {title}
                      </Text>
                      {children ? (
                        <Text
                          style={{
                            margin: "5px 0 0",
                            fontSize: 12.5,
                            color: brand.colors.textMuted,
                            lineHeight: 1.6,
                            fontFamily: brand.fonts.body,
                          }}
                        >
                          {children}
                        </Text>
                      ) : null}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Ficha resumen del pedido
// ---------------------------------------------------------------------------

export interface SummaryRow {
  label: string;
  value: React.ReactNode;
  /** Resalta la fila (se usa para el total). */
  strong?: boolean;
}

/**
 * Ficha compacta de datos clave del pedido (número, fecha, total, método de
 * pago). Antes esa información iba suelta dentro de un párrafo y el cliente
 * tenía que leerla para encontrarla; acá se escanea de un vistazo.
 */
export function SummaryCard({ title, rows }: { title?: string; rows: SummaryRow[] }) {
  return (
    <Section
      style={{
        backgroundColor: brand.colors.softGray,
        border: `1px solid ${brand.colors.border}`,
        borderRadius: 14,
        padding: "18px 20px",
        marginBottom: 28,
        boxShadow: shadows.raised,
      }}
    >
      {title ? (
        <Text
          style={{
            margin: "0 0 12px",
            fontSize: 11.5,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".08em",
            color: brand.colors.textFaint,
            fontFamily: brand.fonts.body,
          }}
        >
          {title}
        </Text>
      ) : null}
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label}>
              <td
                valign="top"
                style={{
                  paddingBottom: i === rows.length - 1 ? 0 : 9,
                  fontSize: 12.5,
                  color: brand.colors.textMuted,
                  fontFamily: brand.fonts.body,
                  lineHeight: 1.5,
                }}
              >
                {row.label}
              </td>
              <td
                valign="top"
                align="right"
                style={{
                  paddingBottom: i === rows.length - 1 ? 0 : 9,
                  paddingLeft: 12,
                  fontSize: row.strong ? 14 : 12.5,
                  fontWeight: row.strong ? 700 : 600,
                  color: brand.colors.navy,
                  fontFamily: brand.fonts.body,
                  lineHeight: 1.5,
                  // Cifras tabulares: evita que los montos "bailen" de ancho
                  // entre filas cuando cambian los dígitos.
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
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
