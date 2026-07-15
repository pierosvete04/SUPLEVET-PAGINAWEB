import { Resend } from "resend";

let client: Resend | null = null;

// Cliente singleton — evita crear una instancia nueva en cada invocación
// de function/route en el entorno serverless de Next.js.
export function getResendClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY no está configurada en las variables de entorno");
    }
    client = new Resend(apiKey);
  }
  return client;
}

export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL ?? "Suplevet <notificaciones@suplevet.pe>";
