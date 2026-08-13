// Comprueba que cada evento que el código empuja al dataLayer tenga su
// trigger y su tag en GTM. Sirve como chequeo antes de publicar y para
// detectar eventos huérfanos (se miden en el código pero nadie los reenvía).
//
// Uso:
//   node scripts/gtm/verificar-eventos.mjs

import { getTagManagerClient, getGtmIds } from "./client.mjs";

const tagmanager = getTagManagerClient();
const { accountId, containerId } = getGtmIds();
const parentContainer = `accounts/${accountId}/containers/${containerId}`;

// Todo lo que trackEvent() manda hoy desde el código.
const EVENTOS_DEL_CODIGO = [
  "view_item", "view_item_list", "select_item", "add_to_cart", "remove_from_cart",
  "begin_checkout", "add_shipping_info", "add_payment_info", "checkout_bloqueado",
  "checkout_error", "purchase", "login", "login_codigo_enviado", "login_error",
  "cupon_aplicado", "cupon_rechazado", "faq_abierta", "banner_click",
  "video_producto_abierto", "galeria_zoom", "filtro_blog", "generate_lead",
  "whatsapp_click", "submit_review", "distribuidor_lead_error",
];

const { data: wsRes } = await tagmanager.accounts.containers.workspaces.list({
  parent: parentContainer,
});
const ws = `${parentContainer}/workspaces/${wsRes.workspace[0].workspaceId}`;

const trgRes = await tagmanager.accounts.containers.workspaces.triggers.list({ parent: ws });
const tagsRes = await tagmanager.accounts.containers.workspaces.tags.list({ parent: ws });

const triggers = trgRes.data.trigger ?? [];
const tags = tagsRes.data.tag ?? [];

// Un trigger cubre un evento si su filtro de evento personalizado apunta a él.
function triggerDeEvento(evento) {
  return triggers.find((t) =>
    (t.customEventFilter ?? []).some((f) =>
      (f.parameter ?? []).some((p) => p.key === "arg1" && p.value === evento)
    )
  );
}

const sinCobertura = [];

for (const evento of EVENTOS_DEL_CODIGO) {
  const trigger = triggerDeEvento(evento);
  const tag = trigger
    ? tags.find((t) => (t.firingTriggerId ?? []).includes(trigger.triggerId))
    : null;

  if (!trigger || !tag) {
    sinCobertura.push({ evento, trigger: !!trigger, tag: !!tag });
    console.log(`FALTA  ${evento}  (trigger=${!!trigger}, tag=${!!tag})`);
  } else {
    console.log(`ok     ${evento}  ->  ${tag.name}`);
  }
}

console.log(
  sinCobertura.length === 0
    ? `\nTodos los ${EVENTOS_DEL_CODIGO.length} eventos del código tienen trigger y tag.`
    : `\n${sinCobertura.length} evento(s) sin cobertura completa.`
);
