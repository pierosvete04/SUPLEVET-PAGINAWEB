// Migracion de una sola corrida: corrige los tags/triggers/variables rotos
// del contenedor web de GTM (SUPLEVET WEB - NEXT.JS) y agrega tracking de
// clicks en botones. Ver conversacion 2026-08-11 para el diagnostico
// completo. Solo toca el Default Workspace — no publica ninguna version.
//
// Uso:
//   node scripts/gtm/apply-fixes.mjs

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

// ---------------------------------------------------------------------
// 1-4. Arreglar el swap parameter/parameterValue en las 4 variables rotas
// ---------------------------------------------------------------------

await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.variables.update({
      path: `${parentWorkspace}/variables/48`,
      requestBody: {
        name: "GA4 - add_to_cart",
        type: "gtes",
        parameter: gtes([
          ["item_slug", "{{DLV - item_slug}}"],
          ["item_name", "{{DLV - item_name}}"],
          ["value", "{{DLV - value}}"],
          ["quantity", "{{DLV - quantity}}"],
        ]),
      },
    }),
  "variable 48 GA4 - add_to_cart (swap corregido)"
);

await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.variables.update({
      path: `${parentWorkspace}/variables/51`,
      requestBody: {
        name: "GA4 - purchase",
        type: "gtes",
        parameter: gtes([
          ["transaction_id", "{{DLV - transaction_id}}"],
          ["value", "{{DLV - value}}"],
          ["metodo_pago", "{{DLV - metodo_pago}}"],
        ]),
      },
    }),
  "variable 51 GA4 - purchase (swap corregido)"
);

await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.variables.update({
      path: `${parentWorkspace}/variables/53`,
      requestBody: {
        name: "whatsapp_click",
        type: "gtes",
        parameter: gtes([["origen", "{{DLV - origen}}"]]),
      },
    }),
  "variable 53 whatsapp_click (swap corregido)"
);

await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.variables.update({
      path: `${parentWorkspace}/variables/55`,
      requestBody: {
        name: "submit_review",
        type: "gtes",
        parameter: gtes([
          ["item_slug", "{{DLV - item_slug}}"],
          ["item_name", "{{DLV - item_name}}"],
          ["calificacion", "{{DLV - calificacion}}"],
        ]),
      },
    }),
  "variable 55 submit_review (swap corregido)"
);

// ---------------------------------------------------------------------
// 5-6. Crear variable GA4 - begin_checkout real y apuntar el tag ahi
// ---------------------------------------------------------------------

const beginCheckoutVar = await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.variables.create({
      parent: parentWorkspace,
      requestBody: {
        name: "GA4 - begin_checkout",
        type: "gtes",
        parameter: gtes([
          ["item_slug", "{{DLV - item_slug}}"],
          ["item_name", "{{DLV - item_name}}"],
          ["value", "{{DLV - value}}"],
          ["quantity", "{{DLV - quantity}}"],
        ]),
      },
    }),
  "variable nueva GA4 - begin_checkout"
);

await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.tags.update({
      path: `${parentWorkspace}/tags/50`,
      requestBody: {
        name: "GA4 - begin_checkout",
        type: "gaawe",
        firingTriggerId: ["44"],
        tagFiringOption: "oncePerEvent",
        parameter: [
          { type: "boolean", key: "sendEcommerceData", value: "false" },
          { type: "template", key: "eventName", value: "begin_checkout" },
          { type: "template", key: "measurementIdOverride", value: GA4_MEASUREMENT_ID },
          {
            type: "template",
            key: "eventSettingsVariable",
            value: `{{GA4 - begin_checkout}}`,
          },
        ],
      },
    }),
  "tag 50 GA4 - begin_checkout (ahora usa su propia variable)"
);

// ---------------------------------------------------------------------
// 7-9. Un solo tag de configuracion GA4 (elimina el duplicado que causaba
// el page_view doble), elimina el tag basura "GA4 - Configuracion"
// ---------------------------------------------------------------------

await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.tags.update({
      path: `${parentWorkspace}/tags/41`,
      requestBody: {
        name: "Etiqueta G-23Q3WKB4V2",
        type: "googtag",
        firingTriggerId: ["2147479573"],
        tagFiringOption: "oncePerEvent",
        parameter: [
          { type: "template", key: "tagId", value: GA4_MEASUREMENT_ID },
          {
            type: "list",
            key: "configSettingsTable",
            list: [
              {
                type: "map",
                map: [
                  { type: "template", key: "parameter", value: "transport_url" },
                  {
                    type: "template",
                    key: "parameterValue",
                    value: "https://server-side-tagging-bqukqpssla-uc.a.run.app",
                  },
                ],
              },
              {
                type: "map",
                map: [
                  { type: "template", key: "parameter", value: "send_page_view" },
                  { type: "template", key: "parameterValue", value: "true" },
                ],
              },
            ],
          },
        ],
      },
    }),
  "tag 41 Etiqueta G-23Q3WKB4V2 (ahora enruta tambien por el sGTM)"
);

await withRetry(
  () => tagmanager.accounts.containers.workspaces.tags.delete({ path: `${parentWorkspace}/tags/29` }),
  "tag 29 FB_CONVERSIONS_API...GA4_Config eliminado (duplicado)"
);

await withRetry(
  () => tagmanager.accounts.containers.workspaces.tags.delete({ path: `${parentWorkspace}/tags/42` }),
  'tag 42 "GA4 - Configuracion" eliminado (evento basura)'
);

// ---------------------------------------------------------------------
// 10-11. Los tags de Meta ya no disparan en DOM Ready (trigger 16), solo
// en el trigger de eventos personalizados (ahora acotado, ver paso 12)
// ---------------------------------------------------------------------

await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.tags.update({
      path: `${parentWorkspace}/tags/30`,
      requestBody: {
        name: "FB_CONVERSIONS_API-1610072311016626-Web-Tag-GA4_Event",
        type: "gaawe",
        firingTriggerId: ["17"],
        tagFiringOption: "oncePerEvent",
        parameter: [
          {
            type: "list",
            key: "eventSettingsTable",
            list: [
              ["user_data", "{{FB_CONVERSIONS_API-1610072311016626-Web-Variable-User_Data}}"],
              ["currency", "{{FB_CONVERSIONS_API-1610072311016626-Web-Variable-Custom_Data_Currency}}"],
              ["items", "{{FB_CONVERSIONS_API-1610072311016626-Web-Variable-Custom_Data_Items}}"],
              [
                "transaction_id",
                "{{FB_CONVERSIONS_API-1610072311016626-Web-Variable-Custom_Data_Transaction_ID}}",
              ],
              ["value", "{{FB_CONVERSIONS_API-1610072311016626-Web-Variable-Custom_Data_Value}}"],
              ["event_id", "{{FB_CONVERSIONS_API-1610072311016626-Web-Variable-Event_ID_Constant}}"],
              ["event_name", "{{FB_CONVERSIONS_API-1610072311016626-Web-Variable-FBEventName}}"],
              ["first_party_collection", "true"],
              ["x-fb-ck-fbp", "{{FB_CONVERSIONS_API-1610072311016626-Web-Variable-FBP_Cookie}}"],
              ["x-fb-ck-fbc", "{{FB_CONVERSIONS_API-1610072311016626-Web-Variable-FBC_Cookie}}"],
            ].map(([parameter, parameterValue]) => ({
              type: "map",
              map: [
                { type: "template", key: "parameter", value: parameter },
                { type: "template", key: "parameterValue", value: parameterValue },
              ],
            })),
          },
          { type: "template", key: "eventName", value: "{{Event}}" },
          { type: "template", key: "measurementIdOverride", value: GA4_MEASUREMENT_ID },
        ],
      },
    }),
  "tag 30 FB GA4_Event (ya no dispara en DOM Ready)"
);

await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.tags.update({
      path: `${parentWorkspace}/tags/32`,
      requestBody: {
        name: "FB_CONVERSIONS_API-1610072311016626-Web-Tag-Pixel_Template",
        type: "cvt_5RM3Q",
        firingTriggerId: ["17"],
        tagFiringOption: "oncePerEvent",
        parameter: [
          {
            type: "template",
            key: "pixelId",
            value: "{{FB_CONVERSIONS_API-1610072311016626-Web-Variable-Pixel_ID}}",
          },
          {
            type: "template",
            key: "variableEventName",
            value: "{{FB_CONVERSIONS_API-1610072311016626-Web-Variable-FBEventName}}",
          },
          {
            type: "template",
            key: "eventId",
            value: "{{FB_CONVERSIONS_API-1610072311016626-Web-Variable-Event_ID_Constant}}",
          },
          { type: "boolean", key: "useGA4Ecommerce", value: "true" },
          { type: "template", key: "eventName", value: "variable" },
        ],
      },
    }),
  "tag 32 FB Pixel_Template (ya no dispara en DOM Ready)"
);

// ---------------------------------------------------------------------
// 12. Acotar el trigger de Meta: solo eventos de negocio reales, no ".+"
// ---------------------------------------------------------------------

await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.triggers.update({
      path: `${parentWorkspace}/triggers/17`,
      requestBody: {
        name: "FB_CONVERSIONS_API-1610072311016626-Web-Trigger-Custom_Event",
        type: "customEvent",
        customEventFilter: [
          {
            type: "matchRegex",
            parameter: [
              { type: "template", key: "arg0", value: "{{_event}}" },
              {
                type: "template",
                key: "arg1",
                value: "^(add_to_cart|begin_checkout|purchase|whatsapp_click|submit_review)$",
              },
            ],
          },
        ],
      },
    }),
  "trigger 17 acotado a eventos de negocio reales (antes: cualquier evento)"
);

// ---------------------------------------------------------------------
// 13. Borrar la variable GA4 huerfana con measurement ID distinto
// ---------------------------------------------------------------------

await withRetry(
  () => tagmanager.accounts.containers.workspaces.variables.delete({ path: `${parentWorkspace}/variables/3` }),
  'variable 3 "GA4" (G-C0C501W4X6, huerfana) eliminada'
);

// ---------------------------------------------------------------------
// 14-17. Tracking de clicks en TODOS los botones de la web (sin tocar
// codigo — usa el listener de clicks nativo de GTM)
// ---------------------------------------------------------------------

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

const buttonClickVar = await withRetry(
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

console.log("\nListo. Todos los cambios quedaron en el Default Workspace, sin publicar todavia.");
