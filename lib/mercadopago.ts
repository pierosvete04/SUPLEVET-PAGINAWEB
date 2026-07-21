import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

// Server-only: el Access Token nunca debe llegar al navegador. Se usa tanto
// para crear la preferencia de pago (app/api/checkout/mercadopago) como para
// leer el resultado de un pago desde el webhook (app/api/webhooks/mercadopago).
function getAccessToken(): string {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN en las variables de entorno.");
  }
  return accessToken;
}

function getClient(): MercadoPagoConfig {
  return new MercadoPagoConfig({ accessToken: getAccessToken() });
}

export function getMercadoPagoPreferenceClient(): Preference {
  return new Preference(getClient());
}

export function getMercadoPagoPaymentClient(): Payment {
  return new Payment(getClient());
}
