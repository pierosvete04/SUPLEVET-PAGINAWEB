"use client";

// Opt-in de "Reseñas de Clientes en Google" (Google Merchant Center).
// Debe ir en la página de confirmación de pedido con los datos reales de ESE
// pedido — Google usa esto para enviarle al cliente una encuesta de
// satisfacción unos días después de la fecha de entrega estimada.
// Doc: https://support.google.com/merchants/answer/14629205
import Script from "next/script";

interface GoogleReviewsOptInProps {
  merchantId: number;
  orderId: string;
  email: string;
  deliveryCountry: string;
  /** Formato yyyy-mm-dd (ver fechaComoInput en lib/rotulo.ts). */
  estimatedDeliveryDate: string;
  /** GTIN de los productos del pedido, si se cuenta con ellos (opcional). */
  gtins?: string[];
}

declare global {
  interface Window {
    gapi?: {
      load: (module: string, callback: () => void) => void;
      surveyoptin: {
        render: (config: Record<string, unknown>) => void;
      };
    };
  }
}

export function GoogleReviewsOptIn({
  merchantId,
  orderId,
  email,
  deliveryCountry,
  estimatedDeliveryDate,
  gtins,
}: GoogleReviewsOptInProps) {
  return (
    <Script
      src="https://apis.google.com/js/platform.js"
      strategy="lazyOnload"
      onLoad={() => {
        window.gapi?.load("surveyoptin", () => {
          window.gapi?.surveyoptin.render({
            merchant_id: merchantId,
            order_id: orderId,
            email,
            delivery_country: deliveryCountry,
            estimated_delivery_date: estimatedDeliveryDate,
            ...(gtins && gtins.length > 0 ? { products: gtins.map((gtin) => ({ gtin })) } : {}),
          });
        });
      }}
    />
  );
}
