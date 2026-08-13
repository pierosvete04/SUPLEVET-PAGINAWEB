// Continuacion de apply-fixes-2.mjs: solo la parte de tracking SPA
// (History Change + page_view virtual), que fallo por el nombre de la
// variable incorporada "pageTitle" (no existe en GTM). Los arreglos de
// Click Text ya se aplicaron.
//
// Uso:
//   node scripts/gtm/apply-spa-pageview.mjs

import { getTagManagerClient, getGtmIds } from "./client.mjs";

const tagmanager = getTagManagerClient();
const { accountId, containerId } = getGtmIds();
const GA4_MEASUREMENT_ID = "G-23Q3WKB4V2";
const parentContainer = `accounts/${accountId}/containers/${containerId}`;

async function withRetry(fn, label) {
  for (let i = 1; i <= 4; i++) {
    try {
      const res = await fn();
      console.log(`OK  ${label}`);
      return res;
    } catch (err) {
      const status = err.status ?? err.code;
      if (![502, 503, 429].includes(status) || i === 4) {
        console.error(`FAIL  ${label}:`, err.message);
        throw err;
      }
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
}

const { data: wsRes } = await tagmanager.accounts.containers.workspaces.list({
  parent: parentContainer,
});
const workspace = wsRes.workspace[0];
const parentWorkspace = `${parentContainer}/workspaces/${workspace.workspaceId}`;
console.log(`Usando workspace "${workspace.name}" (id=${workspace.workspaceId})\n`);

const jsPageTitle = await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.variables.create({
      parent: parentWorkspace,
      requestBody: {
        name: "JS - Page Title",
        type: "jsm",
        parameter: [
          { type: "template", key: "javascript", value: "function() {\n  return document.title;\n}\n" },
        ],
      },
    }),
  "variable nueva JS - Page Title"
);

const historyTrigger = await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.triggers.create({
      parent: parentWorkspace,
      requestBody: {
        name: "History Change - Todas las paginas (SPA)",
        type: "historyChange",
      },
    }),
  "trigger nuevo History Change - Todas las paginas (SPA)"
);

await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.tags.create({
      parent: parentWorkspace,
      requestBody: {
        name: "GA4 - page_view (SPA)",
        type: "gaawe",
        firingTriggerId: [historyTrigger.data.triggerId],
        tagFiringOption: "oncePerEvent",
        parameter: [
          { type: "boolean", key: "sendEcommerceData", value: "false" },
          { type: "template", key: "eventName", value: "page_view" },
          { type: "template", key: "measurementIdOverride", value: GA4_MEASUREMENT_ID },
          {
            type: "list",
            key: "eventSettingsTable",
            list: [
              ["page_location", "{{Page URL}}"],
              ["page_path", "{{Page Path}}"],
              ["page_title", "{{JS - Page Title}}"],
            ].map(([parameter, parameterValue]) => ({
              type: "map",
              map: [
                { type: "template", key: "parameter", value: parameter },
                { type: "template", key: "parameterValue", value: parameterValue },
              ],
            })),
          },
        ],
      },
    }),
  "tag nuevo GA4 - page_view (SPA)"
);

console.log(
  `\nListo. Cambios en el workspace "${workspace.name}". Falta publicar cuando confirmes en Preview.`
);
