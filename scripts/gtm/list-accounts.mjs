// Lista las cuentas y contenedores de GTM visibles para la cuenta autorizada.
// Usalo despues de get-refresh-token.mjs para obtener GTM_ACCOUNT_ID y
// GTM_CONTAINER_ID y pegarlos en .env.local.
//
// Uso:
//   node scripts/gtm/list-accounts.mjs

import { getTagManagerClient } from "./client.mjs";

const tagmanager = getTagManagerClient();

const { data: accountsResponse } = await tagmanager.accounts.list();
const accounts = accountsResponse.account ?? [];

if (accounts.length === 0) {
  console.log("No se encontraron cuentas de GTM visibles para esta cuenta Google.");
  process.exit(0);
}

for (const account of accounts) {
  console.log(`\nCuenta: ${account.name}  (accountId=${account.accountId})`);

  const { data: containersResponse } = await tagmanager.accounts.containers.list({
    parent: `accounts/${account.accountId}`,
  });
  const containers = containersResponse.container ?? [];

  if (containers.length === 0) {
    console.log("  (sin contenedores)");
    continue;
  }

  for (const container of containers) {
    console.log(
      `  - ${container.name}  (containerId=${container.containerId}, publicId=${container.publicId})`
    );
  }
}

console.log(
  "\nCopia el accountId y containerId correspondientes a GTM_ACCOUNT_ID / " +
    "GTM_CONTAINER_ID en .env.local.\n"
);
