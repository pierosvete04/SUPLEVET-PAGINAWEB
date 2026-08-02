import { Img, Section, Text } from "@react-email/components";
import * as React from "react";
import { brand, gradients, shadows } from "./components/brand";
import { EmailLayout } from "./components/EmailLayout";
import type { EmailIconName } from "./components/brand";
import {
  BodyText,
  CategoryLabel,
  CtaButton,
  EmailIcon,
  Headline,
} from "./components/primitives";

export interface ItemCarrito {
  nombre: string;
  cantidad: number;
  precio: number;
  /** Mismo campo `imagen` que trae CartItem (y que sale de productos_web).
   * Opcional: si el producto no tiene foto se dibuja un marcador en su lugar
   * en vez de un ícono roto. */
  imagen?: string;
}

export interface CarritoAbandonadoProps {
  nombre: string;
  /** El carrito real puede tener varios productos — la versión anterior de
   * este correo solo mostraba uno y el resto quedaba invisible. */
  items: ItemCarrito[];
  subtotal: number;
  /** SuplePoints que gana si completa la compra. Lo calcula
   * encolar_carritos_abandonados() con los mismos multiplicadores que
   * acreditar_puntos_pedido_web(), para que el correo no prometa un número
   * distinto al que después se acredita. */
  puntos: number;
  checkoutUrl?: string;
}

const fmt = (n: number) => `S/.${n.toFixed(2)}`;

const features: { icon: EmailIconName; label: string }[] = [
  { icon: "microscope", label: "Respaldo científico" },
  { icon: "stethoscope", label: "Fórmula veterinaria" },
  { icon: "flagPe", label: "Hecho en Perú" },
];

const THUMB = 64;

// Un correo no tiene contexto de origen: una ruta relativa ("/productos/x.png")
// nunca resuelve en Gmail, y las URLs de suplevet.pe hoy caen en la tienda
// Shopify vieja (404) — el mismo motivo por el que el logo se mudó a R2, ver
// brand.ts. Si la imagen no es una URL absoluta y confiable, es preferible el
// marcador a un ícono roto.
function imagenUsable(url?: string): boolean {
  if (!url || !url.startsWith("https://")) return false;
  return !url.startsWith("https://suplevet.pe/");
}

// Marcador para productos sin foto. Un <Img> con src vacío sale como ícono
// roto en Gmail, que se ve peor que no poner nada; este bloque mantiene la
// fila alineada y no depende de ninguna imagen remota.
function MiniaturaVacia() {
  return (
    <div
      style={{
        width: THUMB,
        height: THUMB,
        backgroundColor: brand.colors.softGray,
        border: `1px solid ${brand.colors.border}`,
        borderRadius: 10,
        textAlign: "center",
        lineHeight: `${THUMB}px`,
      }}
    >
      <EmailIcon name="paw" />
    </div>
  );
}

function FilaProducto({ item, ultimo }: { item: ItemCarrito; ultimo: boolean }) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{
        marginBottom: ultimo ? 0 : 14,
        paddingBottom: ultimo ? 0 : 14,
        borderBottom: ultimo ? "none" : `1px solid ${brand.colors.border}`,
      }}
    >
      <tbody>
        <tr>
          <td width={THUMB} valign="top">
            {imagenUsable(item.imagen) ? (
              <Img
                src={item.imagen}
                width={THUMB}
                height={THUMB}
                alt={item.nombre}
                style={{
                  display: "block",
                  borderRadius: 10,
                  border: `1px solid ${brand.colors.border}`,
                  backgroundColor: brand.colors.softGray,
                  objectFit: "cover",
                }}
              />
            ) : (
              <MiniaturaVacia />
            )}
          </td>
          <td valign="top" style={{ paddingLeft: 14 }}>
            <Text
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
                color: brand.colors.navy,
                lineHeight: 1.35,
                fontFamily: brand.fonts.body,
              }}
            >
              {item.nombre}
            </Text>
            <Text
              style={{
                margin: "3px 0 0",
                fontSize: 12,
                color: brand.colors.textMuted,
                fontFamily: brand.fonts.body,
              }}
            >
              Cantidad: {item.cantidad}
            </Text>
          </td>
          <td valign="top" align="right" style={{ paddingLeft: 10 }}>
            <Text
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
                color: brand.colors.navy,
                fontFamily: brand.fonts.body,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {fmt(item.precio * item.cantidad)}
            </Text>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default function CarritoAbandonado({
  nombre = "Juan",
  items = [
    {
      nombre: "Suplevet Articulaciones 150 g",
      cantidad: 2,
      precio: 89.9,
      imagen: "https://pub-ad8cb8681bd8458ba537a43f6735a89d.r2.dev/productos-web-fotos/suplevet-150g/hero-estudio.png",
    },
  ],
  subtotal = 179.8,
  puntos = 35,
  checkoutUrl = `${brand.siteUrl}/carrito`,
}: CarritoAbandonadoProps) {
  return (
    <EmailLayout
      previewText={`${nombre}, tu carrito sigue guardado — ganas ${puntos} SuplePoints al completarlo`}
      stripeGradient={gradients.orange}
    >
      <CategoryLabel icon="cart">Tu carrito te espera</CategoryLabel>
      <Headline size="md">¿Se te olvidó algo, {nombre}?</Headline>
      <BodyText marginBottom={24}>
        Guardamos tu carrito tal como lo dejaste. Suplevet trabaja desde el interior: refuerza el
        sistema inmune, mejora la digestión y le da un pelaje visiblemente mejor a tu mascota.
      </BodyText>

      {/* Ficha del carrito: una fila por producto, con miniatura, cantidad y
          precio de línea. La versión anterior mostraba la foto gigante de un
          solo producto y ocultaba el resto del carrito. */}
      <Section
        style={{
          backgroundColor: "#ffffff",
          border: `1px solid ${brand.colors.border}`,
          borderRadius: 14,
          padding: "18px 20px",
          marginBottom: 22,
          boxShadow: shadows.raised,
        }}
      >
        <Text
          style={{
            margin: "0 0 14px",
            fontSize: 11.5,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".08em",
            color: brand.colors.textFaint,
            fontFamily: brand.fonts.body,
          }}
        >
          Lo que dejaste
        </Text>

        {items.map((item, i) => (
          <FilaProducto key={`${item.nombre}-${i}`} item={item} ultimo={i === items.length - 1} />
        ))}

        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ marginTop: 14, borderTop: `1px solid ${brand.colors.border}`, paddingTop: 12 }}
        >
          <tbody>
            <tr>
              <td>
                <Text
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: brand.colors.navy,
                    fontFamily: brand.fonts.body,
                  }}
                >
                  Subtotal
                </Text>
              </td>
              <td align="right">
                <Text
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 800,
                    color: brand.colors.orange,
                    fontFamily: brand.fonts.body,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {fmt(subtotal)}
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* Incentivo con SuplePoints en vez de un cupón de descuento: usa el
          programa de fidelidad que ya existe, no toca el margen, y el número es
          el mismo que después acredita acreditar_puntos_pedido_web(). */}
      {puntos > 0 ? (
        <Section
          style={{
            backgroundColor: brand.colors.warnTint,
            border: `1px solid #F2E3C9`,
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: 26,
            boxShadow: shadows.raised,
          }}
        >
          <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
            <tbody>
              <tr>
                <td width={26} valign="top" style={{ paddingTop: 2 }}>
                  <EmailIcon name="paw" align="top" />
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
                    Ganas {puntos} SuplePoints si completas esta compra
                  </Text>
                  <Text
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12,
                      color: brand.colors.textMuted,
                      lineHeight: 1.55,
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    Se acreditan cuando recibes el pedido y los canjeas por descuentos, envíos
                    gratis o productos.
                  </Text>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>
      ) : null}

      <CtaButton href={checkoutUrl}>Completar mi compra →</CtaButton>

      <table
        role="presentation"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        style={{ borderTop: `1px solid ${brand.colors.border}`, paddingTop: 18, marginBottom: 18 }}
      >
        <tbody>
          <tr>
            {features.map((f) => (
              <td key={f.label} align="center" style={{ width: `${100 / features.length}%` }}>
                <Text style={{ margin: "0 0 5px", fontSize: 0, lineHeight: 0 }}>
                  <EmailIcon name={f.icon} />
                </Text>
                <Text
                  style={{
                    margin: 0,
                    fontSize: 10.5,
                    lineHeight: 1.35,
                    color: brand.colors.textMuted,
                    fontFamily: brand.fonts.body,
                  }}
                >
                  {f.label}
                </Text>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

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
