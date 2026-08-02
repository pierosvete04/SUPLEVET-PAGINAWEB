import * as React from "react";
import { brand, gradients } from "./components/brand";
import { EmailLayout } from "./components/EmailLayout";
import {
  AlertBox,
  BodyText,
  CategoryLabel,
  CtaButton,
  Headline,
  OrderProgress,
  StepsList,
} from "./components/primitives";

export interface PagoEnVerificacionProps {
  nombre: string;
  numeroPedido: string;
  metodoPago: "Yape" | "Plin" | "transferencia" | "tarjeta" | "contra entrega";
  whatsappUrl: string;
}

export default function PagoEnVerificacion({
  nombre = "Juan",
  numeroPedido = "W-1001",
  metodoPago = "Yape",
  whatsappUrl = "https://wa.me/51920723721",
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
        <CategoryLabel icon="packageCheck">Pedido confirmado</CategoryLabel>
        <Headline size="md">Tu pedido está en camino, {nombre}</Headline>

        <OrderProgress current="preparacion" />

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

        <CtaButton href={whatsappUrl} variant="whatsapp">
          Coordinar mi entrega
        </CtaButton>

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
      <CategoryLabel icon="clock">En verificación</CategoryLabel>
      <Headline size="md">Estamos validando tu pago, {nombre}</Headline>

      <OrderProgress current="pagado" />

      <AlertBox tone="info" title={`Falta un paso para confirmar el pedido #${numeroPedido}`}>
        Necesitamos {textoMetodo} para validar la transacción. Puedes enviárnoslo por WhatsApp o
        respondiendo a este mismo correo.
      </AlertBox>

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

      <CtaButton href={whatsappUrl} variant="whatsapp">
        Enviar mi voucher
      </CtaButton>

      <BodyText marginBottom={0}>
        Si ya enviaste tu comprobante, ignora este mensaje — ya lo estamos procesando.
      </BodyText>
    </EmailLayout>
  );
}
