import * as React from "react";
import { gradients } from "./components/brand";
import { EmailLayout } from "./components/EmailLayout";
import {
  BodyText,
  CategoryLabel,
  Divider,
  Headline,
  OtpCodeBlock,
  SecurityNote,
} from "./components/primitives";

export interface OtpLoginProps {
  /** Código numérico — en Supabase Auth Hooks viene en `email_data.token`. */
  token: string;
  validezMinutos?: number;
}

export default function OtpLogin({ token = "482913", validezMinutos = 10 }: OtpLoginProps) {
  return (
    <EmailLayout
      previewText={`${token} — tu código de acceso a Suplevet`}
      stripeGradient={gradients.orange}
    >
      <CategoryLabel>Portal de clientes</CategoryLabel>
      <Headline>
        Tu código
        <br />
        de acceso
      </Headline>
      <BodyText marginBottom={36}>
        Ingresa el siguiente código en el portal para iniciar sesión. No lo compartas con nadie.
      </BodyText>

      <OtpCodeBlock code={token} caption={`Válido por ${validezMinutos} minutos`} />

      <Divider />

      <SecurityNote>
        Si no solicitaste este código, puedes ignorar este correo con seguridad. Tu cuenta está
        protegida.
      </SecurityNote>
    </EmailLayout>
  );
}
