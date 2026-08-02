// Transporte crudo hacia la Bot API de Telegram. Server-only: el token da
// control total del bot, así que nunca debe llegar al bundle del cliente (no
// lleva prefijo NEXT_PUBLIC_ a propósito).
//
// Se usa para los avisos internos del equipo (pedido nuevo, cambio de estado
// de pago). Es complementario al correo a ventas@suplevet.pe, no lo reemplaza:
// Telegram llega al celular en segundos, el correo queda como registro.

const TELEGRAM_API = "https://api.telegram.org";

/** Timeout corto: un aviso interno nunca debe colgar la respuesta al cliente. */
const TIMEOUT_MS = 8000;

export interface ResultadoTelegram {
  error: string | null;
}

/**
 * Destinatarios configurados. Acepta varios IDs separados por coma para poder
 * avisar a más de una persona o a un grupo sin tocar código.
 */
function chatIds(): string[] {
  return (process.env.TELEGRAM_CHAT_ID ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function telegramConfigurado(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()) && chatIds().length > 0;
}

/** Escapa los tres caracteres que Telegram interpreta en parse_mode HTML. */
export function escaparHtml(valor: string): string {
  return valor.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function enviarAChat(token: string, chatId: string, texto: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const respuesta = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        chat_id: chatId,
        text: texto,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      }),
    });

    if (!respuesta.ok) {
      // El cuerpo de error de Telegram trae la causa real (chat no encontrado,
      // bot bloqueado, HTML mal formado); sin él el 400 no dice nada.
      const detalle = await respuesta.text().catch(() => "");
      return `chat ${chatId}: HTTP ${respuesta.status} ${detalle}`.trim();
    }
    return null;
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "error desconocido";
    return `chat ${chatId}: ${mensaje}`;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Manda un mensaje a todos los chats configurados. Nunca lanza: los avisos
 * internos son best-effort y no deben tumbar el checkout ni el webhook.
 */
export async function enviarMensajeTelegram(texto: string): Promise<ResultadoTelegram> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const destinos = chatIds();

  if (!token || destinos.length === 0) {
    return { error: "Telegram no configurado (falta TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID)" };
  }

  const errores = (await Promise.all(destinos.map((chatId) => enviarAChat(token, chatId, texto))))
    .filter((error): error is string => error !== null);

  return { error: errores.length > 0 ? errores.join(" | ") : null };
}
