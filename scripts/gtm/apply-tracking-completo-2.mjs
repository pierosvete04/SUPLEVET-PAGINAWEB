// Continuacion de apply-tracking-completo.mjs (las 4 variables JS ya se
// crearon; fallo el nombre de la built-in de scroll). Crea las built-in
// correctas, los triggers y los tags.
//
// Uso:
//   node scripts/gtm/apply-tracking-completo-2.mjs

import { getTagManagerClient, getGtmIds } from "./client.mjs";

const tagmanager = getTagManagerClient();
const { accountId, containerId } = getGtmIds();
const GA4_MEASUREMENT_ID = "G-23Q3WKB4V2";
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

const settingsTable = (rows) => ({
  type: "list",
  key: "eventSettingsTable",
  list: rows.map(([parameter, parameterValue]) => ({
    type: "map",
    map: [
      { type: "template", key: "parameter", value: parameter },
      { type: "template", key: "parameterValue", value: parameterValue },
    ],
  })),
});

const ga4Tag = (name, eventName, triggerId, rows) => ({
  parent: ws,
  requestBody: {
    name,
    type: "gaawe",
    firingTriggerId: [triggerId],
    tagFiringOption: "oncePerEvent",
    parameter: [
      { type: "boolean", key: "sendEcommerceData", value: "false" },
      { type: "template", key: "eventName", value: eventName },
      { type: "template", key: "measurementIdOverride", value: GA4_MEASUREMENT_ID },
      settingsTable(rows),
    ],
  },
});

await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.built_in_variables.create({
      parent: ws,
      type: ["scrollDepthThreshold", "scrollDepthUnits"],
    }),
  "built-in variables de Scroll habilitadas"
);

const trgLink = await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.triggers.create({
      parent: ws,
      requestBody: {
        name: "Click - Todos los enlaces",
        type: "linkClick",
        waitForTags: { type: "boolean", value: "false" },
        checkValidation: { type: "boolean", value: "false" },
        filter: [
          {
            type: "matchRegex",
            parameter: [
              { type: "template", key: "arg0", value: "{{Click URL}}" },
              { type: "template", key: "arg1", value: ".+" },
            ],
          },
        ],
      },
    }),
  "trigger Click - Todos los enlaces"
);

const trgScroll = await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.triggers.create({
      parent: ws,
      requestBody: {
        name: "Scroll - 25/50/75/90",
        type: "scrollDepth",
        parameter: [
          { type: "boolean", key: "verticalThresholdOn", value: "true" },
          { type: "template", key: "verticalThresholdsPercent", value: "25,50,75,90" },
          { type: "template", key: "verticalThresholdUnits", value: "PERCENT" },
          { type: "template", key: "triggerStartOption", value: "WINDOW_LOAD" },
        ],
      },
    }),
  "trigger Scroll - 25/50/75/90"
);

const trgPagar = await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.triggers.create({
      parent: ws,
      requestBody: {
        name: "Click - Boton Pagar ahora (checkout)",
        type: "click",
        filter: [
          {
            type: "cssSelector",
            parameter: [
              { type: "template", key: "arg0", value: "{{Click Element}}" },
              { type: "template", key: "arg1", value: "button, button *" },
            ],
          },
          {
            type: "contains",
            parameter: [
              { type: "template", key: "arg0", value: "{{JS - Texto del Click}}" },
              { type: "template", key: "arg1", value: "Pagar ahora" },
            ],
          },
        ],
      },
    }),
  "trigger Click - Boton Pagar ahora (checkout)"
);

const trgVerCarrito = await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.triggers.create({
      parent: ws,
      requestBody: {
        name: "Click - Abrir carrito",
        type: "click",
        filter: [
          {
            type: "cssSelector",
            parameter: [
              { type: "template", key: "arg0", value: "{{Click Element}}" },
              { type: "template", key: "arg1", value: "[aria-label='Carrito'], [aria-label='Carrito'] *" },
            ],
          },
        ],
      },
    }),
  "trigger Click - Abrir carrito"
);

await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.tags.create(
      ga4Tag("GA4 - link_click", "link_click", trgLink.data.triggerId, [
        ["link_text", "{{JS - Texto del Click}}"],
        ["link_url", "{{Click URL}}"],
        ["seccion", "{{JS - Seccion del Click}}"],
        ["page_path", "{{Page Path}}"],
        ["content_group", "{{JS - Tipo de Pagina}}"],
        ["es_saliente", "{{JS - Es Enlace Saliente}}"],
      ])
    ),
  "tag GA4 - link_click"
);

await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.tags.create(
      ga4Tag("GA4 - scroll", "scroll", trgScroll.data.triggerId, [
        ["percent_scrolled", "{{Scroll Depth Threshold}}"],
        ["page_path", "{{Page Path}}"],
        ["content_group", "{{JS - Tipo de Pagina}}"],
      ])
    ),
  "tag GA4 - scroll"
);

await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.tags.create(
      ga4Tag("GA4 - checkout_pagar_click", "checkout_pagar_click", trgPagar.data.triggerId, [
        ["boton_texto", "{{JS - Texto del Click}}"],
        ["page_path", "{{Page Path}}"],
        ["content_group", "{{JS - Tipo de Pagina}}"],
      ])
    ),
  "tag GA4 - checkout_pagar_click"
);

await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.tags.create(
      ga4Tag("GA4 - view_cart", "view_cart", trgVerCarrito.data.triggerId, [
        ["seccion", "{{JS - Seccion del Click}}"],
        ["page_path", "{{Page Path}}"],
        ["content_group", "{{JS - Tipo de Pagina}}"],
      ])
    ),
  "tag GA4 - view_cart"
);

console.log(`\nListo. Cambios en el workspace "${workspace.name}".`);
