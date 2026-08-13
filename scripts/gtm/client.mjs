// Cliente autenticado de Tag Manager API, compartido por los scripts de
// scripts/gtm/*.mjs. Usa GTM_CLIENT_ID / GTM_CLIENT_SECRET / GTM_REFRESH_TOKEN
// de .env.local (ver get-refresh-token.mjs para generar el refresh token).

import { google } from "googleapis";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
dotenv.config({ path: path.join(projectRoot, ".env.local") });

export function getTagManagerClient() {
  const { GTM_CLIENT_ID, GTM_CLIENT_SECRET, GTM_REFRESH_TOKEN } = process.env;

  if (!GTM_CLIENT_ID || !GTM_CLIENT_SECRET || !GTM_REFRESH_TOKEN) {
    throw new Error(
      "Faltan credenciales de GTM en .env.local (GTM_CLIENT_ID, " +
        "GTM_CLIENT_SECRET, GTM_REFRESH_TOKEN). Corre primero " +
        "scripts/gtm/get-refresh-token.mjs."
    );
  }

  const oauth2Client = new google.auth.OAuth2(GTM_CLIENT_ID, GTM_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: GTM_REFRESH_TOKEN });

  return google.tagmanager({ version: "v2", auth: oauth2Client });
}

export function getGtmIds() {
  const { GTM_ACCOUNT_ID, GTM_CONTAINER_ID } = process.env;
  if (!GTM_ACCOUNT_ID || !GTM_CONTAINER_ID) {
    throw new Error(
      "Faltan GTM_ACCOUNT_ID / GTM_CONTAINER_ID en .env.local. Corre " +
        "scripts/gtm/list-accounts.mjs para obtenerlos."
    );
  }
  return { accountId: GTM_ACCOUNT_ID, containerId: GTM_CONTAINER_ID };
}
