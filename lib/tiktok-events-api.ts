import { createHash } from "node:crypto";

const TIKTOK_EVENTS_API_URL = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hashEmail(email: string | null | undefined): string[] | undefined {
  const normalizado = email?.trim().toLowerCase();
  return normalizado ? [sha256(normalizado)] : undefined;
}

// cliente_telefono se guarda como el numero local peruano de 9 digitos, sin
// el +51 (ver comentario en app/api/checkout/mercadopago/route.ts). TikTok
// exige el telefono en formato E.164 antes de hashearlo.
function hashPhone(telefonoLocal: string | null | undefined): string[] | undefined {
  const digitos = telefonoLocal?.replace(/\D/g, "");
  return digitos ? [sha256(`+51${digitos}`)] : undefined;
}

interface CompletePaymentParams {
  pedidoId: string;
  numeroPedido: string;
  valor: number;
  clienteEmail: string | null;
  clienteTelefono: string | null;
}

// Envia el evento CompletePayment del pixel de TikTok "SUPLEVET OFICIAL"
// (DA1I29RC77UDKVSV339G) via la API de Eventos server-side, como complemento
// al ttq.track('CompletePayment') que ya dispara el pixel del navegador.
//
// Se llama unicamente desde el webhook de Mercado Pago cuando un pago con
// tarjeta queda aprobado (ver app/api/webhooks/mercadopago/route.ts) — es la
// unica fuente de verdad server-side confiable que hay hoy. Los pedidos
// contra entrega NO pasan por acá: ese flujo no confirma el pago por este
// mismo camino, así que solo les queda el evento del pixel del navegador.
//
// El event_id es fijo por pedido (no aleatorio) para que reintentos del
// webhook de Mercado Pago no generen el mismo evento duplicado del lado de
// TikTok.
export async function enviarCompletePaymentTikTok({
  pedidoId,
  numeroPedido,
  valor,
  clienteEmail,
  clienteTelefono,
}: CompletePaymentParams): Promise<{ error: string | null }> {
  const pixelId = process.env.TIKTOK_PIXEL_ID;
  const accessToken = process.env.TIKTOK_EVENTS_API_ACCESS_TOKEN;
  if (!pixelId || !accessToken) {
    return { error: "TIKTOK_PIXEL_ID / TIKTOK_EVENTS_API_ACCESS_TOKEN no configurados en .env.local" };
  }

  const body = {
    event_source: "web",
    event_source_id: pixelId,
    data: [
      {
        event: "CompletePayment",
        event_time: Math.floor(Date.now() / 1000),
        event_id: `purchase-${pedidoId}`,
        user: {
          email: hashEmail(clienteEmail),
          phone: hashPhone(clienteTelefono),
        },
        properties: {
          content_type: "product",
          value: valor,
          currency: "PEN",
          order_id: numeroPedido,
        },
      },
    ],
  };

  try {
    const response = await fetch(TIKTOK_EVENTS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": accessToken,
      },
      body: JSON.stringify(body),
    });

    const json: unknown = await response.json().catch(() => null);
    const code = (json as { code?: number } | null)?.code;
    if (!response.ok || code !== 0) {
      return { error: `TikTok Events API respondió ${response.status}: ${JSON.stringify(json)}` };
    }
    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return { error: message };
  }
}
