// Uso: node scripts/enviar-correos-auth-prueba.mjs <correo-destino>
// Dispara los correos de autenticación REALES: no los renderiza acá, sino que
// pide a Supabase Auth que los mande, que a su vez llama al Edge Function
// `send-auth-email`. Es la única forma de probar de verdad esa función —
// renderizar las plantillas del repo Next probaría la copia equivocada, porque
// el Edge Function corre en Deno con sus propios archivos duplicados
// (ver el comentario de emails/components/brand.ts).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const destino = process.argv[2];
if (!destino) {
  console.error("Falta el correo destino: node scripts/enviar-correos-auth-prueba.mjs tucorreo@ejemplo.com");
  process.exit(1);
}

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(join(raiz, ".env.local"), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

// `shouldCreateUser: false` a propósito: la prueba no debe crear una cuenta
// nueva en auth.users si el correo no existe, solo mandarle el código a una
// cuenta que ya está.
const pruebas = [
  [
    "otp-login (código de acceso)",
    () => supabase.auth.signInWithOtp({ email: destino, options: { shouldCreateUser: false } }),
  ],
  [
    "reset-password (restablecer contraseña)",
    () => supabase.auth.resetPasswordForEmail(destino, { redirectTo: "https://suplevet.pe/mi-cuenta" }),
  ],
];

for (const [etiqueta, ejecutar] of pruebas) {
  const { error } = await ejecutar();
  console.log(error ? `  FALLO  ${etiqueta} — ${error.message}` : `  ok     ${etiqueta}`);
  // Supabase Auth limita los envíos por correo/hora; con una pausa corta entre
  // los dos se evita que el segundo rebote por rate limit.
  await pausa(2000);
}

// change-email NO se dispara acá: cambiar el correo de una cuenta real es
// destructivo (si la confirmación se completa, el usuario pierde el acceso con
// su correo anterior). Usa exactamente el mismo EmailLayout y los mismos
// primitives que los dos de arriba, así que si esos dos llegan bien, lo único
// sin verificar de ese correo es su ícono `mailCheck`.
console.log("\nchange-email omitido a propósito — ver comentario al final del script.");
