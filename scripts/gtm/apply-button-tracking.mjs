// Continuacion de apply-fixes.mjs: solo la parte de tracking de botones,
// que fallo por el nombre del operador CSS. Ver ese archivo para el resto
// de correcciones (ya aplicadas).
//
// Uso:
//   node scripts/gtm/apply-button-tracking.mjs

import { getTagManagerClient, getGtmIds } from "./client.mjs";

const tagmanager = getTagManagerClient();
const { accountId, containerId } = getGtmIds();
const GA4_MEASUREMENT_ID = "G-23Q3WKB4V2";
const parentWorkspace = `accounts/${accountId}/containers/${containerId}/workspaces/6`;

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

const gtes = (rows) => [
  {
    type: "list",
    key: "eventSettingsTable",
    list: rows.map(([param, valueTemplate]) => ({
      type: "map",
      map: [
        { type: "template", key: "parameter", value: param },
        { type: "template", key: "parameterValue", value: valueTemplate },
      ],
    })),
  },
];

const buttonTrigger = await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.triggers.create({
      parent: parentWorkspace,
      requestBody: {
        name: "Click - Todos los botones",
        type: "click",
        filter: [
          {
            type: "cssSelector",
            parameter: [
              { type: "template", key: "arg0", value: "{{Click Element}}" },
              {
                type: "template",
                key: "arg1",
                value: "button, [role='button'], input[type='submit'], input[type='button']",
              },
            ],
          },
        ],
      },
    }),
  "trigger nuevo Click - Todos los botones"
);

await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.variables.create({
      parent: parentWorkspace,
      requestBody: {
        name: "GA4 - button_click",
        type: "gtes",
        parameter: gtes([
          ["button_text", "{{Click Text}}"],
          ["button_id", "{{Click ID}}"],
          ["button_classes", "{{Click Classes}}"],
          ["page_path", "{{Page Path}}"],
        ]),
      },
    }),
  "variable nueva GA4 - button_click"
);

await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.tags.create({
      parent: parentWorkspace,
      requestBody: {
        name: "GA4 - button_click",
        type: "gaawe",
        firingTriggerId: [buttonTrigger.data.triggerId],
        tagFiringOption: "oncePerEvent",
        parameter: [
          { type: "boolean", key: "sendEcommerceData", value: "false" },
          { type: "template", key: "eventName", value: "button_click" },
          { type: "template", key: "measurementIdOverride", value: GA4_MEASUREMENT_ID },
          { type: "template", key: "eventSettingsVariable", value: "{{GA4 - button_click}}" },
        ],
      },
    }),
  "tag nuevo GA4 - button_click (dispara en cualquier boton de la web)"
);

console.log("\nListo. Tracking de botones agregado al Default Workspace.");
