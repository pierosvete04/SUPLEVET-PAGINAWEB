import * as React from "react";
import { gradients } from "./components/brand";
import { EmailLayout } from "./components/EmailLayout";
import {
  BodyText,
  CategoryLabel,
  CtaButton,
  Divider,
  FallbackLinkBox,
  Headline,
  SecurityNote,
} from "./components/primitives";

export interface ChangeEmailProps {
  /** En Supabase Auth Hooks se arma con `email_data.token_hash_new` + `email_data.redirect_to`. */
  confirmationUrl: string;
  validezHoras?: number;
}

export default function ChangeEmail({
  confirmationUrl = "https://portal.suplevet.pe/confirmar-correo?token=eyJhbGciOiJIUzI1NiJ9",
  validezHoras = 1,
}: ChangeEmailProps) {
  return (
    <EmailLayout previewText="Confirma tu nuevo correo de Suplevet" stripeGradient={gradients.orange}>
      <CategoryLabel>Portal de clientes</CategoryLabel>
      <Headline>
        Confirma tu
        <br />
        nuevo correo
      </Headline>
      <BodyText>
        Solicitaste cambiar el correo de tu cuenta en Suplevet. Haz clic en el botón para
        confirmar tu nueva dirección. El enlace expira en{" "}
        <strong style={{ color: "#1E3A5F" }}>
          {validezHoras} hora{validezHoras === 1 ? "" : "s"}
        </strong>
        .
      </BodyText>

      <CtaButton href={confirmationUrl}>Confirmar nuevo correo</CtaButton>

      <FallbackLinkBox url={confirmationUrl} />

      <Divider />

      <SecurityNote>
        Si no solicitaste este cambio, ignora este correo. Tu correo actual seguirá siendo el
        mismo y tu cuenta permanece protegida.
      </SecurityNote>
    </EmailLayout>
  );
}
