// Flujo OAuth2 "desktop app" (loopback) para Google Tag Manager API.
// Corre una sola vez: abre un login en tu navegador, capturas el codigo
// de vuelta en un server local, y guarda el refresh_token en .env.local.
//
// Uso:
//   node scripts/gtm/get-refresh-token.mjs
//
// Requiere GTM_CLIENT_ID y GTM_CLIENT_SECRET ya presentes en .env.local
// (ver seccion "Google Tag Manager API").

import { google } from "googleapis";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
const envPath = path.join(projectRoot, ".env.local");

dotenv.config({ path: envPath });

const CLIENT_ID = process.env.GTM_CLIENT_ID;
const CLIENT_SECRET = process.env.GTM_CLIENT_SECRET;
const PORT = 4321;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

const SCOPES = [
  "https://www.googleapis.com/auth/tagmanager.edit.containers",
  "https://www.googleapis.com/auth/tagmanager.edit.containerversions",
  "https://www.googleapis.com/auth/tagmanager.publish",
  "https://www.googleapis.com/auth/tagmanager.manage.accounts",
];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Falta GTM_CLIENT_ID o GTM_CLIENT_SECRET en .env.local. Revisa la seccion 'Google Tag Manager API'."
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline", // necesario para que Google entregue refresh_token
  prompt: "consent", // fuerza a reemitir refresh_token aunque ya hayas autorizado antes
  scope: SCOPES,
});

console.log("\nAbre esta URL en tu navegador (con la cuenta que administra GTM):\n");
console.log(authUrl);
console.log("\nEsperando autorizacion...\n");

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith("/oauth2callback")) {
    res.writeHead(404);
    res.end();
    return;
  }

  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h2>Autorizacion rechazada: ${error}</h2>`);
    console.error(`Google devolvio un error: ${error}`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400);
    res.end("Falta el parametro 'code'.");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      "<h2>Listo, ya puedes cerrar esta pestana.</h2><p>Vuelve a la terminal.</p>"
    );

    if (!tokens.refresh_token) {
      console.warn(
        "\nGoogle no devolvio refresh_token. Esto pasa si ya habias autorizado " +
          "esta app antes. Ve a https://myaccount.google.com/permissions, revoca " +
          "el acceso de 'Suplevet GTM Integration' y vuelve a correr este script.\n"
      );
      server.close();
      process.exit(1);
    }

    updateEnvFile(envPath, "GTM_REFRESH_TOKEN", tokens.refresh_token);
    console.log("Refresh token guardado en .env.local (GTM_REFRESH_TOKEN).");
    console.log(
      "\nSiguiente paso: node scripts/gtm/list-accounts.mjs para obtener " +
        "GTM_ACCOUNT_ID y GTM_CONTAINER_ID.\n"
    );
  } catch (err) {
    console.error("Error al intercambiar el codigo por tokens:", err.message);
  } finally {
    server.close();
    process.exit(0);
  }
});

server.listen(PORT, () => {
  // Servidor listo, esperando el redirect de Google.
});

function updateEnvFile(filePath, key, value) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const pattern = new RegExp(`^${key}=`);
  let found = false;

  const nextLines = lines.map((line) => {
    if (pattern.test(line)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!found) {
    nextLines.push(`${key}=${value}`);
  }

  fs.writeFileSync(filePath, nextLines.join("\n"));
}
