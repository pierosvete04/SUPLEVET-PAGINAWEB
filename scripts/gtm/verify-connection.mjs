// Prueba rapida de que las credenciales GTM_* en .env.local funcionan de
// punta a punta: lista los workspaces del contenedor configurado.
//
// Uso:
//   node scripts/gtm/verify-connection.mjs

import { getTagManagerClient, getGtmIds } from "./client.mjs";

const tagmanager = getTagManagerClient();
const { accountId, containerId } = getGtmIds();

const { data } = await tagmanager.accounts.containers.workspaces.list({
  parent: `accounts/${accountId}/containers/${containerId}`,
});

const workspaces = data.workspace ?? [];

console.log(`Conexion OK. Workspaces en el contenedor ${containerId}:\n`);
for (const ws of workspaces) {
  console.log(`  - ${ws.name}  (workspaceId=${ws.workspaceId})`);
}
