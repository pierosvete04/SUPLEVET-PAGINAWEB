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

export interface ResetPasswordProps {
  /** En Supabase Auth Hooks se arma con `email_data.token_hash` + `email_data.redirect_to`. */
  confirmationUrl: string;
  validezHoras?: number;
}

export default function ResetPassword({
  confirmationUrl = "https://portal.suplevet.pe/reset-password?token=eyJhbGciOiJIUzI1NiJ9",
  validezHoras = 1,
}: ResetPasswordProps) {
  return (
    <EmailLayout previewText="Restablece tu contraseña de Suplevet" stripeGradient={gradients.orange}>
      <CategoryLabel>Portal de clientes</CategoryLabel>
      <Headline>
        Restablece tu
        <br />
        contraseña
      </Headline>
      <BodyText>
        Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón
        para continuar. El enlace expira en{" "}
        <strong style={{ color: "#1E3A5F" }}>
          {validezHoras} hora{validezHoras === 1 ? "" : "s"}
        </strong>
        .
      </BodyText>

      <CtaButton href={confirmationUrl}>Restablecer contraseña</CtaButton>

      <FallbackLinkBox url={confirmationUrl} />

      <Divider />

      <SecurityNote>
        Si no solicitaste este cambio, ignora este correo. Tu cuenta sigue segura y no se
        realizará ningún cambio.
      </SecurityNote>
    </EmailLayout>
  );
}
