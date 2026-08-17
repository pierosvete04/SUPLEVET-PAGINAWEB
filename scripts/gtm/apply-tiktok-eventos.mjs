// Eventos de negocio del TikTok Pixel (AddToCart, InitiateCheckout,
// CompletePayment), reusando los mismos triggers EVT-* y variables DLV-*
// que ya alimentan GA4/Meta. Requiere haber corrido antes
// apply-tiktok-pixel.mjs (necesita window.ttq ya cargado).
//
// Uso:
//   node scripts/gtm/apply-tiktok-eventos.mjs

import { getTagManagerClient, getGtmIds } from "./client.mjs";

const tagmanager = getTagManagerClient();
const { accountId, containerId } = getGtmIds();
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

// name: nombre del tag | triggerId: trigger EVT-* existente | ttqEvent: evento estandar de TikTok | body: contenido del objeto de propiedades
const EVENTS = [
  {
    name: "TikTok - AddToCart",
    triggerId: "43", // EVT - add_to_cart
    ttqEvent: "AddToCart",
    props: `
      content_id: '{{DLV - item_slug}}',
      content_name: '{{DLV - item_name}}',
      content_type: 'product',
      quantity: {{DLV - quantity}},
      value: {{DLV - value}},
      currency: 'PEN'`,
  },
  {
    name: "TikTok - InitiateCheckout",
    triggerId: "44", // EVT - begin_checkout
    ttqEvent: "InitiateCheckout",
    props: `
      content_id: '{{DLV - item_slug}}',
      content_name: '{{DLV - item_name}}',
      content_type: 'product',
      quantity: {{DLV - quantity}},
      value: {{DLV - value}},
      currency: 'PEN'`,
  },
  {
    name: "TikTok - CompletePayment",
    triggerId: "45", // EVT - purchase
    ttqEvent: "CompletePayment",
    props: `
      content_type: 'product',
      value: {{DLV - value}},
      currency: 'PEN',
      order_id: '{{DLV - transaction_id}}'`,
  },
];

for (const evt of EVENTS) {
  const html = `<script>
  if (window.ttq) {
    ttq.track('${evt.ttqEvent}', {${evt.props}
    });
  }
</script>`;

  const created = await withRetry(
    () =>
      tagmanager.accounts.containers.workspaces.tags.create({
        parent: parentWorkspace,
        requestBody: {
          name: evt.name,
          type: "html",
          firingTriggerId: [evt.triggerId],
          tagFiringOption: "oncePerEvent",
          parameter: [
            { type: "template", key: "html", value: html },
            { type: "boolean", key: "supportDocumentWrite", value: "false" },
          ],
        },
      }),
    `tag nuevo ${evt.name}`
  );
  console.log(`  tagId=${created.data.tagId}  ${evt.name} -> ttq.track('${evt.ttqEvent}')`);
}

console.log(
  `\nListo. Falta publicar cuando confirmes (node scripts/gtm/publish.mjs 224041664 "TikTok Pixel + eventos").`
);
