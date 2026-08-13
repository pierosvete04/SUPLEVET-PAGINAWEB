// Crea una version del contenedor a partir del Default Workspace y la
// publica. Esto SI queda en vivo en el sitio real.
//
// Uso:
//   node scripts/gtm/publish.mjs <containerId> "<nombre de la version>"

import { getTagManagerClient, getGtmIds } from "./client.mjs";

const tagmanager = getTagManagerClient();
const { accountId } = getGtmIds();
const containerId = process.argv[2];
const versionName = process.argv[3] ?? "Correccion de eventos GA4/Meta + tracking de botones";

if (!containerId) {
  console.error('Uso: node scripts/gtm/publish.mjs <containerId> "<nombre>"');
  process.exit(1);
}

async function withRetry(fn, label) {
  for (let i = 1; i <= 4; i++) {
    try {
      const res = await fn();
      console.log(`OK  ${label}`);
      return res;
    } catch (err) {
      const status = err.status ?? err.code;
      if (![502, 503, 429].includes(status) || i === 4) throw err;
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
}

// El workspace activo cambia cada vez que se publica (GTM crea uno nuevo),
// asi que hay que resolverlo en cada corrida en vez de fijarlo.
const parentContainer = `accounts/${accountId}/containers/${containerId}`;
const { data: wsRes } = await tagmanager.accounts.containers.workspaces.list({
  parent: parentContainer,
});
const workspace = wsRes.workspace[0];
const parentWorkspace = `${parentContainer}/workspaces/${workspace.workspaceId}`;
console.log(`Workspace "${workspace.name}" (id=${workspace.workspaceId})`);

const created = await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.create_version({
      path: parentWorkspace,
      requestBody: {
        name: versionName,
        notes:
          "Corrige swap parametro/valor en eventos GA4 (add_to_cart, purchase, whatsapp_click, submit_review), " +
          "crea variable propia para begin_checkout, elimina tag googtag duplicado (page_view doble), elimina " +
          "tag basura 'GA4 - Configuracion', acota trigger de Meta a eventos de negocio reales, elimina " +
          "variable GA4 huerfana, y agrega tracking de clicks en todos los botones (evento button_click).",
      },
    }),
  "Version creada a partir del workspace"
);

const containerVersionId = created.data.containerVersion.containerVersionId;
console.log(`containerVersionId=${containerVersionId}`);

await withRetry(
  () =>
    tagmanager.accounts.containers.versions.publish({
      path: `accounts/${accountId}/containers/${containerId}/versions/${containerVersionId}`,
    }),
  `Version ${containerVersionId} PUBLICADA`
);

console.log("\nListo. Los cambios ya estan en vivo.");
