// Lista las cuentas de Google Ads a las que el refresh token tiene acceso.
// Sirve para saber que poner en GADS_CUSTOMER_ID y GADS_LOGIN_CUSTOMER_ID.
//
// Uso:
//   node scripts/seo/list-ads-accounts.mjs
//
// Requiere GADS_DEVELOPER_TOKEN y GADS_REFRESH_TOKEN en .env.local.

import { google } from "googleapis";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
dotenv.config({ path: path.join(projectRoot, ".env.local") });

// Mantener igual que API_VERSION en lib/google-ads-keywords.ts.
const API_VERSION = "v21";

const CLIENT_ID = process.env.GADS_CLIENT_ID ?? process.env.GTM_CLIENT_ID;
const CLIENT_SECRET = process.env.GADS_CLIENT_SECRET ?? process.env.GTM_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GADS_REFRESH_TOKEN;
const DEVELOPER_TOKEN = process.env.GADS_DEVELOPER_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error(
    "Faltan credenciales OAuth. Corre primero: node scripts/seo/get-ads-refresh-token.mjs"
  );
  process.exit(1);
}

if (!DEVELOPER_TOKEN) {
  console.error(
    "Falta GADS_DEVELOPER_TOKEN en .env.local. Se obtiene en el API Center de tu cuenta\n" +
      "de administrador (MCC) de Google Ads: Herramientas > Configuracion > API Center."
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

try {
  const { token } = await oauth2Client.getAccessToken();

  const respuesta = await fetch(
    `https://googleads.googleapis.com/${API_VERSION}/customers:listAccessibleCustomers`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "developer-token": DEVELOPER_TOKEN,
      },
    }
  );

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    const detalle =
      datos?.error?.details?.[0]?.errors?.[0]?.message ??
      datos?.error?.message ??
      `Google Ads respondio ${respuesta.status}`;
    console.error("Error:", detalle);
    if (respuesta.status === 403) {
      console.error(
        "\nUn 403 aca suele significar que el developer token todavia esta en nivel\n" +
          "'Test Account'. Solicita Basic Access en el API Center y espera la aprobacion."
      );
    }
    process.exit(1);
  }

  const cuentas = datos.resourceNames ?? [];

  if (cuentas.length === 0) {
    console.log("\nEsta cuenta de Google no administra ninguna cuenta de Google Ads.\n");
    process.exit(0);
  }

  console.log("\nCuentas accesibles:\n");
  for (const recurso of cuentas) {
    // Vienen como "customers/1234567890".
    const id = recurso.split("/")[1];
    console.log(`  ${id}`);
  }
  console.log(
    "\nEn .env.local:\n" +
      "  GADS_CUSTOMER_ID=<la cuenta que quieres consultar>\n" +
      "  GADS_LOGIN_CUSTOMER_ID=<tu cuenta MCC, si es distinta>\n"
  );
} catch (err) {
  console.error("Error al consultar Google Ads:", err.message);
  process.exit(1);
}
