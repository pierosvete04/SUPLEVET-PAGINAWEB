// Vuelca la configuracion completa (tags, triggers, variables, y clients si
// es un contenedor server-side) de un contenedor GTM, para poder auditarlo.
//
// Uso:
//   node scripts/gtm/audit.mjs <containerId>
//   node scripts/gtm/audit.mjs 224041664   # web
//   node scripts/gtm/audit.mjs 260455665   # server

import { getTagManagerClient } from "./client.mjs";

const tagmanager = getTagManagerClient();
const containerId = process.argv[2];

if (!containerId) {
  console.error("Uso: node scripts/gtm/audit.mjs <containerId>");
  process.exit(1);
}

const { data: accountsResponse } = await tagmanager.accounts.list();
let accountId;
let containerMeta;

for (const account of accountsResponse.account ?? []) {
  const { data: containersResponse } = await tagmanager.accounts.containers.list({
    parent: `accounts/${account.accountId}`,
  });
  const match = (containersResponse.container ?? []).find(
    (c) => c.containerId === containerId
  );
  if (match) {
    accountId = account.accountId;
    containerMeta = match;
    break;
  }
}

if (!accountId) {
  console.error(`No se encontro el contenedor ${containerId} en ninguna cuenta.`);
  process.exit(1);
}

const parentContainer = `accounts/${accountId}/containers/${containerId}`;

const { data: workspacesResponse } = await tagmanager.accounts.containers.workspaces.list({
  parent: parentContainer,
});
const workspace = (workspacesResponse.workspace ?? [])[0];

if (!workspace) {
  console.error("El contenedor no tiene workspaces.");
  process.exit(1);
}

const parentWorkspace = `${parentContainer}/workspaces/${workspace.workspaceId}`;

async function withRetry(fn, label, attempts = 4) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      const status = err.status ?? err.code;
      const isRetryable = status === 502 || status === 503 || status === 429;
      if (!isRetryable || i === attempts) throw err;
      const waitMs = 1500 * i;
      console.error(`(${label}) error ${status}, reintentando en ${waitMs}ms...`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
}

const tagsRes = await withRetry(
  () => tagmanager.accounts.containers.workspaces.tags.list({ parent: parentWorkspace }),
  "tags"
);
const triggersRes = await withRetry(
  () => tagmanager.accounts.containers.workspaces.triggers.list({ parent: parentWorkspace }),
  "triggers"
);
const variablesRes = await withRetry(
  () => tagmanager.accounts.containers.workspaces.variables.list({ parent: parentWorkspace }),
  "variables"
);

const result = {
  container: {
    name: containerMeta.name,
    containerId: containerMeta.containerId,
    publicId: containerMeta.publicId,
    usageContext: containerMeta.usageContext,
  },
  workspace: { name: workspace.name, workspaceId: workspace.workspaceId },
  tags: (tagsRes.data.tag ?? []).map(simplifyTag),
  triggers: (triggersRes.data.trigger ?? []).map(simplifyTrigger),
  variables: (variablesRes.data.variable ?? []).map(simplifyVariable),
};

// Los contenedores server-side (usageContext=SERVER) tienen ademas "clients".
if ((containerMeta.usageContext ?? []).includes("server")) {
  const clientsRes = await withRetry(
    () => tagmanager.accounts.containers.workspaces.clients.list({ parent: parentWorkspace }),
    "clients"
  );
  result.clients = (clientsRes.data.client ?? []).map((c) => ({
    name: c.name,
    type: c.type,
    priority: c.priority,
    parameter: c.parameter,
  }));
}

console.log(JSON.stringify(result, null, 2));

function simplifyTag(tag) {
  return {
    name: tag.name,
    type: tag.type,
    firingTriggerId: tag.firingTriggerId,
    blockingTriggerId: tag.blockingTriggerId,
    parameter: tag.parameter,
    paused: tag.paused ?? false,
    tagFiringOption: tag.tagFiringOption,
  };
}

function simplifyTrigger(trigger) {
  return {
    name: trigger.name,
    type: trigger.type,
    customEventFilter: trigger.customEventFilter,
    filter: trigger.filter,
  };
}

function simplifyVariable(variable) {
  return {
    name: variable.name,
    type: variable.type,
    parameter: variable.parameter,
  };
}
