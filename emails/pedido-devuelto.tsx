import * as React from "react";
import { brand, gradients } from "./components/brand";
import { EmailLayout } from "./components/EmailLayout";
import {
  AlertBox,
  BodyText,
  CategoryLabel,
  CtaButton,
  Divider,
  Headline,
  OrderProgress,
  StepsList,
} from "./components/primitives";

export interface PedidoDevueltoProps {
  nombre: string;
  numeroPedido: string;
  motivo?: string;
  whatsappUrl: string;
}

export default function PedidoDevuelto({
  nombre = "Juan",
  numeroPedido = "W-1001",
  motivo = "no se pudo completar la entrega",
  whatsappUrl = "https://wa.me/51920723721",
}: PedidoDevueltoProps) {
  return (
    <EmailLayout
      previewText={`Tu pedido #${numeroPedido} volvió a nuestro almacén — coordina el reenvío`}
      stripeGradient={gradients.warn}
    >
      <CategoryLabel icon="rotateCcw">Pedido devuelto</CategoryLabel>
      <Headline size="md">Tu pedido volvió a nuestro almacén, {nombre}</Headline>

      {/* El pedido llegó hasta "En camino" y retrocedió: la barra lo deja ver
          sin que el cliente tenga que deducirlo del texto. */}
      <OrderProgress current="camino" tone="warn" />

      <AlertBox tone="warn" title={`Tu pedido #${numeroPedido} está de vuelta con nosotros`}>
        Motivo: {motivo}. Está guardado y en buen estado — no se pierde nada, solo hay que volver a
        despacharlo.
      </AlertBox>

      <StepsList
        title="¿Qué pasa ahora?"
        steps={[
          {
            title: "Escríbenos por WhatsApp",
            description: "El mensaje ya va listo con tu número de pedido, solo tienes que enviarlo.",
          },
          {
            title: "Confirmamos dirección y horario",
            description: "Ajustamos los datos de entrega para que esta vez sí te encuentre.",
          },
          {
            title: "Sale de nuevo en 24-48 h",
            description: "Te avisamos por correo apenas el pedido vuelva a estar en camino.",
          },
        ]}
      />

      <CtaButton href={whatsappUrl} variant="whatsapp">
        Coordinar mi reenvío
      </CtaButton>

      <Divider />
      <BodyText marginBottom={0}>
        ¿Tienes dudas o necesitas ayuda? Escríbenos a{" "}
        <a href={`mailto:${brand.supportEmail}`} style={{ color: brand.colors.orange }}>
          {brand.supportEmail}
        </a>
        .
      </BodyText>
    </EmailLayout>
  );
}
