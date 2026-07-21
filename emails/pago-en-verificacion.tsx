import * as React from "react";
import { brand, gradients } from "./components/brand";
import { EmailLayout } from "./components/EmailLayout";
import { BodyText, CategoryLabel, CtaButton, Headline, StepsList } from "./components/primitives";

export interface PagoEnVerificacionProps {
  nombre: string;
  numeroPedido: string;
  metodoPago: "Yape" | "Plin" | "transferencia" | "tarjeta" | "contra entrega";
  whatsappUrl?: string;
}

export default function PagoEnVerificacion({
  nombre = "Juan",
  numeroPedido = "W-1001",
  metodoPago = "Yape",
  whatsappUrl = "https://wa.me/51999999999",
}: PagoEnVerificacionProps) {
  // Contra entrega no tiene voucher que validar: el pedido ya está confirmado
  // y lo único pendiente es coordinar la entrega, así que el correo cambia de
  // "estamos validando tu pago" a "coordinemos tu entrega".
  const esContraEntrega = metodoPago === "contra entrega";
  const textoMetodo = metodoPago === "tarjeta" ? "el comprobante de tu pago" : `tu voucher de ${metodoPago}`;

  if (esContraEntrega) {
    return (
      <EmailLayout
        previewText={`Confirmamos tu pedido #${numeroPedido} — pagas al recibirlo`}
        stripeGradient={gradients.warn}
      >
        <CategoryLabel>Pedido confirmado</CategoryLabel>
        <Headline>Tu pedido está en camino, {nombre}</Headline>
        <BodyText>
          Recibimos tu pedido <strong style={{ color: brand.colors.navy }}>#{numeroPedido}</strong>{" "}
          con pago contra entrega. No tienes que pagar nada por adelantado: le pagas al motorizado
          cuando te entregue el paquete.
        </BodyText>

        <StepsList
          title="Qué sigue"
          steps={[
            {
              title: "Coordinamos la entrega",
              description: "Te escribimos por WhatsApp para acordar el día y la hora.",
            },
            {
              title: "Preparamos tu pedido",
              description: "Lo alistamos y lo despachamos con nuestro motorizado.",
            },
            {
              title: "Pagas al recibir",
              description: "Ten listo el monto exacto en efectivo, o paga por Yape/Plin en la puerta.",
            },
          ]}
        />

        <CtaButton href={whatsappUrl}>Coordinar mi entrega por WhatsApp →</CtaButton>

        <BodyText marginBottom={0}>
          Si necesitas cambiar la dirección o la fecha, escríbenos y lo ajustamos.
        </BodyText>
      </EmailLayout>
    );
  }

  return (
    <EmailLayout
      previewText={`Estamos validando tu pago del pedido #${numeroPedido}`}
      stripeGradient={gradients.warn}
    >
      <CategoryLabel>En verificación</CategoryLabel>
      <Headline>Estamos validando tu pago, {nombre}</Headline>
      <BodyText>
        Recibimos tu pedido <strong style={{ color: brand.colors.navy }}>#{numeroPedido}</strong>.
        Para confirmarlo, envíanos {textoMetodo} respondiendo este mismo correo o por WhatsApp.
      </BodyText>

      <StepsList
        title="Cómo proceder"
        steps={[
          {
            title: "Envía tu voucher",
            description: "Comparte la captura de tu transferencia exitosa por WhatsApp.",
          },
          {
            title: "Lo validamos",
            description: "Nuestro equipo verifica la transacción en minutos.",
          },
          {
            title: "Te confirmamos por correo",
            description: "Recibirás la confirmación con los detalles de tu envío.",
          },
        ]}
      />

      <CtaButton href={whatsappUrl}>Enviar voucher por WhatsApp →</CtaButton>

      <BodyText marginBottom={0}>
        Si ya enviaste tu comprobante, ignora este mensaje — ya lo estamos procesando.
      </BodyText>
    </EmailLayout>
  );
}
