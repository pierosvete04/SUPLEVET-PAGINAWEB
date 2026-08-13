// Como audit.mjs pero conservando los IDs (tagId/triggerId/variableId), que
// se necesitan para poder actualizar/borrar items puntuales por API.
//
// Uso:
//   node scripts/gtm/dump-ids.mjs <containerId>

import { getTagManagerClient } from "./client.mjs";

const tagmanager = getTagManagerClient();
const containerId = process.argv[2];
const accountId = process.env.GTM_ACCOUNT_ID;

const parentContainer = `accounts/${accountId}/containers/${containerId}`;
const { data: workspacesResponse } = await tagmanager.accounts.containers.workspaces.list({
  parent: parentContainer,
});
const workspace = workspacesResponse.workspace[0];
const parentWorkspace = `${parentContainer}/workspaces/${workspace.workspaceId}`;

async function withRetry(fn, attempts = 4) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      const status = err.status ?? err.code;
      if (![502, 503, 429].includes(status) || i === attempts) throw err;
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
}

const tags = await withRetry(() =>
  tagmanager.accounts.containers.workspaces.tags.list({ parent: parentWorkspace })
);
const triggers = await withRetry(() =>
  tagmanager.accounts.containers.workspaces.triggers.list({ parent: parentWorkspace })
);
const variables = await withRetry(() =>
  tagmanager.accounts.containers.workspaces.variables.list({ parent: parentWorkspace })
);

console.log(`workspaceId=${workspace.workspaceId}\n`);
console.log("TAGS:");
for (const t of tags.data.tag ?? []) console.log(`  tagId=${t.tagId}  "${t.name}"  (${t.type})`);
console.log("\nTRIGGERS:");
for (const t of triggers.data.trigger ?? [])
  console.log(`  triggerId=${t.triggerId}  "${t.name}"  (${t.type})`);
console.log("\nVARIABLES:");
for (const v of variables.data.variable ?? [])
  console.log(`  variableId=${v.variableId}  "${v.name}"  (${v.type})`);
