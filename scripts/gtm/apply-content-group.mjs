// Cuarta ronda: agrega content_group (tipo de pagina) a los tags que ya
// existian, para que TODOS los eventos — no solo los nuevos — se puedan
// segmentar por seccion del sitio en GA4. Ademas limpia el trigger
// DOM_Ready, que quedo huerfano en la ronda 1 cuando los tags de Meta
// dejaron de dispararse ahi.
//
// Uso:
//   node scripts/gtm/apply-content-group.mjs

import { getTagManagerClient, getGtmIds } from "./client.mjs";

const tagmanager = getTagManagerClient();
const { accountId, containerId } = getGtmIds();
const parentContainer = `accounts/${accountId}/containers/${containerId}`;

async function withRetry(fn, label) {
  for (let i = 1; i <= 4; i++) {
    try {
      const res = await fn();
      console.log(`OK    ${label}`);
      return res;
    } catch (err) {
      const status = err.status ?? err.code;
      if (![502, 503, 429].includes(status) || i === 4) {
        console.error(`FAIL  ${label}: ${err.message}`);
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
const ws = `${parentContainer}/workspaces/${workspace.workspaceId}`;
console.log(`Workspace "${workspace.name}" (id=${workspace.workspaceId})\n`);

// Las variables "gtes" (Configuracion de evento de GA4) que usan los tags de
// negocio. Se les agrega content_group conservando lo que ya tenian.
const eventSettings = {
  48: {
    name: "GA4 - add_to_cart",
    rows: [
      ["item_slug", "{{DLV - item_slug}}"],
      ["item_name", "{{DLV - item_name}}"],
      ["value", "{{DLV - value}}"],
      ["quantity", "{{DLV - quantity}}"],
      ["content_group", "{{JS - Tipo de Pagina}}"],
    ],
  },
  51: {
    name: "GA4 - purchase",
    rows: [
      ["transaction_id", "{{DLV - transaction_id}}"],
      ["value", "{{DLV - value}}"],
      ["metodo_pago", "{{DLV - metodo_pago}}"],
      ["content_group", "{{JS - Tipo de Pagina}}"],
    ],
  },
  53: {
    name: "whatsapp_click",
    rows: [
      ["origen", "{{DLV - origen}}"],
      ["content_group", "{{JS - Tipo de Pagina}}"],
    ],
  },
  55: {
    name: "submit_review",
    rows: [
      ["item_slug", "{{DLV - item_slug}}"],
      ["item_name", "{{DLV - item_name}}"],
      ["calificacion", "{{DLV - calificacion}}"],
      ["content_group", "{{JS - Tipo de Pagina}}"],
    ],
  },
  57: {
    name: "GA4 - begin_checkout",
    rows: [
      ["item_slug", "{{DLV - item_slug}}"],
      ["item_name", "{{DLV - item_name}}"],
      ["value", "{{DLV - value}}"],
      ["quantity", "{{DLV - quantity}}"],
      ["content_group", "{{JS - Tipo de Pagina}}"],
    ],
  },
  // button_click: ademas de content_group, se le agrega la seccion para
  // poder distinguir un mismo texto de boton en home vs en un blog.
  59: {
    name: "GA4 - button_click",
    rows: [
      ["button_text", "{{JS - Texto del Click}}"],
      ["button_id", "{{Click ID}}"],
      ["button_classes", "{{Click Classes}}"],
      ["seccion", "{{JS - Seccion del Click}}"],
      ["page_path", "{{Page Path}}"],
      ["content_group", "{{JS - Tipo de Pagina}}"],
    ],
  },
};

for (const [variableId, { name, rows }] of Object.entries(eventSettings)) {
  await withRetry(
    () =>
      tagmanager.accounts.containers.workspaces.variables.update({
        path: `${ws}/variables/${variableId}`,
        requestBody: {
          name,
          type: "gtes",
          parameter: [
            {
              type: "list",
              key: "eventSettingsTable",
              list: rows.map(([parameter, parameterValue]) => ({
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
    `variable ${variableId} ${name} (+ content_group)`
  );
}

// page_view (SPA): agregar content_group al tag creado en la ronda 2.
await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.tags.update({
      path: `${ws}/tags/64`,
      requestBody: {
        name: "GA4 - page_view (SPA)",
        type: "gaawe",
        firingTriggerId: ["63"],
        tagFiringOption: "oncePerEvent",
        parameter: [
          { type: "boolean", key: "sendEcommerceData", value: "false" },
          { type: "template", key: "eventName", value: "page_view" },
          { type: "template", key: "measurementIdOverride", value: "G-23Q3WKB4V2" },
          {
            type: "list",
            key: "eventSettingsTable",
            list: [
              ["page_location", "{{Page URL}}"],
              ["page_path", "{{Page Path}}"],
              ["page_title", "{{JS - Page Title}}"],
              ["content_group", "{{JS - Tipo de Pagina}}"],
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
  "tag 64 GA4 - page_view (SPA) (+ content_group)"
);

// Trigger DOM_Ready: quedo sin ningun tag asociado tras la ronda 1.
await withRetry(
  () => tagmanager.accounts.containers.workspaces.triggers.delete({ path: `${ws}/triggers/16` }),
  "trigger 16 DOM_Ready eliminado (huerfano)"
);

console.log(`\nListo. Cambios en el workspace "${workspace.name}".`);
