// Evento ViewContent del TikTok Pixel — TikTok lo marca como "Critical" en
// Diagnostics para la vertical Commerce (junto con PageView/AddToCart/
// InitiateCheckout/Purchase, que ya estaban cubiertos por
// apply-tiktok-pixel.mjs y apply-tiktok-eventos.mjs). Reusa el mismo trigger
// EVT - view_item que ya alimenta GA4 - view_item.
//
// Uso:
//   node scripts/gtm/apply-tiktok-viewcontent.mjs

import { getTagManagerClient, getGtmIds } from "./client.mjs";

const tagmanager = getTagManagerClient();
const { accountId, containerId } = getGtmIds();
const VIEW_ITEM_TRIGGER_ID = "99"; // EVT - view_item
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

const html = `<script>
  if (window.ttq) {
    ttq.track('ViewContent', {
      content_id: '{{DLV - item_slug}}',
      content_name: '{{DLV - item_name}}',
      content_type: 'product',
      value: {{DLV - value}},
      currency: 'PEN'
    });
  }
</script>`;

const created = await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.tags.create({
      parent: parentWorkspace,
      requestBody: {
        name: "TikTok - ViewContent",
        type: "html",
        firingTriggerId: [VIEW_ITEM_TRIGGER_ID],
        tagFiringOption: "oncePerEvent",
        parameter: [
          { type: "template", key: "html", value: html },
          { type: "boolean", key: "supportDocumentWrite", value: "false" },
        ],
      },
    }),
  "tag nuevo TikTok - ViewContent"
);

console.log(
  `\ntagId=${created.data.tagId}  TikTok - ViewContent\n\n` +
    `Falta publicar cuando confirmes (node scripts/gtm/publish.mjs 224041664 "TikTok - ViewContent").`
);
