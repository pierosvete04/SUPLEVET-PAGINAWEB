// Utilidad para configurar y probar el bot de avisos de pedidos.
//
//   node scripts/telegram-prueba.mjs chat-id   -> lista los chat IDs que le
//                                                 escribieron al bot (mandale
//                                                 /start primero desde Telegram)
//   node scripts/telegram-prueba.mjs enviar    -> manda un mensaje de prueba a
//                                                 los TELEGRAM_CHAT_ID del .env
import { readFileSync } from "node:fs";

function cargarEnv() {
  const contenido = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const linea of contenido.split(/\r?\n/)) {
    const match = linea.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
  }
}

cargarEnv();

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
if (!token) {
  console.error("Falta TELEGRAM_BOT_TOKEN en .env.local");
  process.exit(1);
}

const api = (metodo) => `https://api.telegram.org/bot${token}/${metodo}`;
const comando = process.argv[2] ?? "chat-id";

if (comando === "chat-id") {
  const datos = await fetch(api("getUpdates")).then((r) => r.json());
  const chats = new Map();
  for (const update of datos.result ?? []) {
    const chat = update.message?.chat ?? update.my_chat_member?.chat ?? update.channel_post?.chat;
    if (chat) chats.set(chat.id, chat);
  }

  if (chats.size === 0) {
    console.log("Ningún chat todavía. Abrí Telegram, buscá el bot y mandale /start.");
    process.exit(0);
  }
  for (const chat of chats.values()) {
    const nombre = chat.title ?? [chat.first_name, chat.last_name].filter(Boolean).join(" ");
    console.log(`TELEGRAM_CHAT_ID=${chat.id}   (${chat.type}: ${nombre})`);
  }
  process.exit(0);
}

if (comando === "enviar") {
  const destinos = (process.env.TELEGRAM_CHAT_ID ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (destinos.length === 0) {
    console.error("Falta TELEGRAM_CHAT_ID en .env.local (corré primero: node scripts/telegram-prueba.mjs chat-id)");
    process.exit(1);
  }

  for (const chatId of destinos) {
    const respuesta = await fetch(api("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        text: "✅ <b>Bot de pedidos conectado</b>\nSi ves este mensaje, los avisos de venta van a llegar acá.",
      }),
    }).then((r) => r.json());
    console.log(chatId, respuesta.ok ? "OK" : JSON.stringify(respuesta));
  }
  process.exit(0);
}

console.error(`Comando desconocido: ${comando}. Usá "chat-id" o "enviar".`);
process.exit(1);
