// Segunda ronda de correcciones (post-publicacion):
// 1. El error de consola "Click Text ... error desconocido" viene de que
//    los botones tienen un <svg> (icono lucide-react) adentro; el clic
//    aterriza en el SVG y la variable incorporada Click Text de GTM no
//    sabe leer texto de un SVGElement. Se reemplaza por una variable JS
//    propia que sube hasta el <button> real con closest() y no revienta.
// 2. El sitio es una SPA (Next.js): navegar a /productos vía <Link> no
//    hace reload de pagina, asi que GTM nunca se entera del cambio de URL
//    (no habia ningun trigger de History Change). Se agrega ese trigger +
//    un tag de "page_view" virtual para que cada navegacion interna cuente.
//
// Uso:
//   node scripts/gtm/apply-fixes-2.mjs

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

// Workspace activo actual (cambia despues de publicar, no asumir un ID fijo)
const { data: wsRes } = await tagmanager.accounts.containers.workspaces.list({
  parent: parentContainer,
});
const workspace = wsRes.workspace[0];
const parentWorkspace = `${parentContainer}/workspaces/${workspace.workspaceId}`;
console.log(`Usando workspace "${workspace.name}" (id=${workspace.workspaceId})\n`);

// ---------------------------------------------------------------------
// 1. Variable JS segura para el texto del boton (reemplaza {{Click Text}})
// ---------------------------------------------------------------------

const jsButtonText = await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.variables.create({
      parent: parentWorkspace,
      requestBody: {
        name: "JS - Button Text",
        type: "jsm",
        parameter: [
          {
            type: "template",
            key: "javascript",
            value:
              "function() {\n" +
              "  try {\n" +
              "    var el = {{Click Element}};\n" +
              "    if (!el) return '';\n" +
              "    var btn = el.closest ? el.closest(\"button, [role='button']\") : el;\n" +
              "    var text = (btn && (btn.innerText || btn.textContent)) || '';\n" +
              "    return text.trim();\n" +
              "  } catch (e) {\n" +
              "    return '';\n" +
              "  }\n" +
              "}\n",
          },
        ],
      },
    }),
  "variable nueva JS - Button Text (segura contra iconos SVG)"
);

await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.variables.update({
      path: `${parentWorkspace}/variables/59`,
      requestBody: {
        name: "GA4 - button_click",
        type: "gtes",
        parameter: [
          {
            type: "list",
            key: "eventSettingsTable",
            list: [
              ["button_text", "{{JS - Button Text}}"],
              ["button_id", "{{Click ID}}"],
              ["button_classes", "{{Click Classes}}"],
              ["page_path", "{{Page Path}}"],
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
  "variable 59 GA4 - button_click (ya no depende de Click Text)"
);

// ---------------------------------------------------------------------
// 2. Tracking de navegacion SPA (History Change) — para /productos, etc.
// ---------------------------------------------------------------------

const jsPageTitle = await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.variables.create({
      parent: parentWorkspace,
      requestBody: {
        name: "JS - Page Title",
        type: "jsm",
        parameter: [
          {
            type: "template",
            key: "javascript",
            value: "function() {\n  return document.title;\n}\n",
          },
        ],
      },
    }),
  "variable nueva JS - Page Title (GTM no trae Page Title incorporada)"
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
  "tag nuevo GA4 - page_view (SPA) (dispara en cada navegacion interna)"
);

console.log(
  `\nListo. Cambios en el workspace "${workspace.name}". Falta publicar cuando confirmes en Preview.`
);
