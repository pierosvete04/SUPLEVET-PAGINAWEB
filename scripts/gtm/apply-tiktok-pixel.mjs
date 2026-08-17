// Instala el TikTok Pixel (cuenta "SUPLEVET OFICIAL", pixel
// CUGJU0JC77U1IEDCU5UG) en el contenedor web via Custom HTML tags, ya que
// no hay plantilla oficial de TikTok en la Gallery accesible por API.
//
// Crea:
//   - Variable constante "TikTok - Pixel ID"
//   - Trigger "Pageview - Todas las paginas" (tipo pageview, carga inicial)
//   - Tag "TikTok - Pixel Base + PageView" (codigo base + ttq.page() inicial)
//   - Tag "TikTok - page_view (SPA)" (ttq.page() en cada History Change,
//     igual que el patron ya usado para GA4 - page_view (SPA))
//
// Uso:
//   node scripts/gtm/apply-tiktok-pixel.mjs

import { getTagManagerClient, getGtmIds } from "./client.mjs";

const tagmanager = getTagManagerClient();
const { accountId, containerId } = getGtmIds();
const TIKTOK_PIXEL_ID = "CUGJU0JC77U1IEDCU5UG";
const SPA_HISTORY_TRIGGER_ID = "63"; // "History Change - Todas las paginas (SPA)"
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

const pixelIdVar = await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.variables.create({
      parent: parentWorkspace,
      requestBody: {
        name: "TikTok - Pixel ID",
        type: "c",
        parameter: [{ type: "template", key: "value", value: TIKTOK_PIXEL_ID }],
      },
    }),
  "variable nueva TikTok - Pixel ID"
);

const pageviewTrigger = await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.triggers.create({
      parent: parentWorkspace,
      requestBody: {
        name: "Pageview - Todas las paginas",
        type: "pageview",
      },
    }),
  "trigger nuevo Pageview - Todas las paginas"
);

const baseCodeHtml = `<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<e.methods.length;n++)ttq.setAndDefer(e,e.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};

  ttq.load('{{TikTok - Pixel ID}}');
  ttq.page();
}(window, document, 'ttq');
</script>`;

const baseTag = await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.tags.create({
      parent: parentWorkspace,
      requestBody: {
        name: "TikTok - Pixel Base + PageView",
        type: "html",
        firingTriggerId: [pageviewTrigger.data.triggerId],
        tagFiringOption: "oncePerEvent",
        parameter: [
          { type: "template", key: "html", value: baseCodeHtml },
          { type: "boolean", key: "supportDocumentWrite", value: "false" },
        ],
      },
    }),
  "tag nuevo TikTok - Pixel Base + PageView"
);

const spaPageviewHtml = `<script>
  if (window.ttq) { ttq.page(); }
</script>`;

const spaTag = await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.tags.create({
      parent: parentWorkspace,
      requestBody: {
        name: "TikTok - page_view (SPA)",
        type: "html",
        firingTriggerId: [SPA_HISTORY_TRIGGER_ID],
        blockingTriggerId: [], // dispara despues del tag base en la carga inicial
        tagFiringOption: "oncePerEvent",
        parameter: [
          { type: "template", key: "html", value: spaPageviewHtml },
          { type: "boolean", key: "supportDocumentWrite", value: "false" },
        ],
      },
    }),
  "tag nuevo TikTok - page_view (SPA)"
);

console.log(
  `\nListo. Cambios en el workspace "${workspace.name}":\n` +
    `  - variableId=${pixelIdVar.data.variableId}  TikTok - Pixel ID\n` +
    `  - triggerId=${pageviewTrigger.data.triggerId}  Pageview - Todas las paginas\n` +
    `  - tagId=${baseTag.data.tagId}  TikTok - Pixel Base + PageView\n` +
    `  - tagId=${spaTag.data.tagId}  TikTok - page_view (SPA)\n\n` +
    `Falta publicar cuando confirmes en Preview (node scripts/gtm/publish.mjs 224041664 "TikTok Pixel").`
);
