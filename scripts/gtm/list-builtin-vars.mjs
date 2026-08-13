import { getTagManagerClient, getGtmIds } from "./client.mjs";

const tagmanager = getTagManagerClient();
const { accountId, containerId } = getGtmIds();
const parentWorkspace = `accounts/${accountId}/containers/${containerId}/workspaces/6`;

const { data } = await tagmanager.accounts.containers.workspaces.built_in_variables.list({
  parent: parentWorkspace,
});

for (const v of data.builtInVariable ?? []) {
  console.log(`${v.type}  (${v.name})`);
}
