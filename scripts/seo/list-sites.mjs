// Lista las propiedades de Search Console que el refresh token puede leer.
// Sirve para saber que poner en GSC_SITE_URL.
//
// Uso:
//   node scripts/seo/list-sites.mjs
//
// Ojo con el formato: una propiedad de DOMINIO se identifica como
// "sc-domain:suplevet.pe" y una de PREFIJO como "https://suplevet.pe/".
// No son intercambiables — hay que copiar exactamente lo que salga aca.

import { google } from "googleapis";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
dotenv.config({ path: path.join(projectRoot, ".env.local") });

const CLIENT_ID = process.env.GSC_CLIENT_ID ?? process.env.GTM_CLIENT_ID;
const CLIENT_SECRET = process.env.GSC_CLIENT_SECRET ?? process.env.GTM_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GSC_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error(
    "Faltan credenciales en .env.local. Corre primero: node scripts/seo/get-refresh-token.mjs"
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const searchconsole = google.searchconsole({ version: "v1", auth: oauth2Client });

try {
  const { data } = await searchconsole.sites.list({});
  const sitios = data.siteEntry ?? [];

  if (sitios.length === 0) {
    console.log(
      "\nEsta cuenta no tiene ninguna propiedad verificada en Search Console.\n" +
        "Verifica suplevet.pe primero en https://search.google.com/search-console\n"
    );
    process.exit(0);
  }

  console.log("\nPropiedades disponibles:\n");
  for (const sitio of sitios) {
    console.log(`  ${sitio.siteUrl}   (permiso: ${sitio.permissionLevel})`);
  }
  console.log("\nCopia la que corresponda a .env.local como:\n  GSC_SITE_URL=<valor>\n");
} catch (err) {
  console.error("Error al consultar Search Console:", err.message);
  process.exit(1);
}
