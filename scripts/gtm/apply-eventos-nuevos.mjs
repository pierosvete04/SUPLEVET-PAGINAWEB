// Quinta ronda: triggers + tags para los eventos de dataLayer que se
// agregaron al código (ver auditoría del 12-ago-2026). Sin esto, el código
// empuja los eventos pero GTM no los reenvía a GA4.
//
// La API de GTM permite 30 peticiones por minuto por usuario, y esta
// migración hace ~60 escrituras: por eso va estrangulada (PAUSA_MS) y es
// idempotente — lee lo que ya existe y solo crea lo que falta, así se puede
// volver a correr sin romper nada si se corta a medias.
//
// Uso:
//   node scripts/gtm/apply-eventos-nuevos.mjs

import { getTagManagerClient, getGtmIds } from "./client.mjs";

const tagmanager = getTagManagerClient();
const { accountId, containerId } = getGtmIds();
const GA4_MEASUREMENT_ID = "G-23Q3WKB4V2";
const parentContainer = `accounts/${accountId}/containers/${containerId}`;

// 30 req/min = 2s exactos; se deja un margen para no rozar el límite.
const PAUSA_MS = 2300;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function llamar(fn, label) {
  for (let intento = 1; intento <= 5; intento++) {
    try {
      const res = await fn();
      console.log(`OK    ${label}`);
      await dormir(PAUSA_MS);
      return res;
    } catch (err) {
      const status = err.status ?? err.code;
      if (status === 429) {
        // El cupo es por minuto: no sirve reintentar a los 2 segundos.
        console.log(`...   cupo agotado, esperando 65s (${label})`);
        await dormir(65_000);
        continue;
      }
      if (![502, 503].includes(status) || intento === 5) {
        console.error(`FAIL  ${label}: ${err.message}`);
        throw err;
      }
      await dormir(2000 * intento);
    }
  }
}

const { data: wsRes } = await tagmanager.accounts.containers.workspaces.list({
  parent: parentContainer,
});
const workspace = wsRes.workspace[0];
const ws = `${parentContainer}/workspaces/${workspace.workspaceId}`;
console.log(`Workspace "${workspace.name}" (id=${workspace.workspaceId})\n`);

// Inventario actual, para saltarse lo ya creado.
const [varsRes, trgRes, tagsRes] = [
  await tagmanager.accounts.containers.workspaces.variables.list({ parent: ws }),
  await tagmanager.accounts.containers.workspaces.triggers.list({ parent: ws }),
  await tagmanager.accounts.containers.workspaces.tags.list({ parent: ws }),
];
const variablesExistentes = new Set((varsRes.data.variable ?? []).map((v) => v.name));
const triggersExistentes = new Map(
  (trgRes.data.trigger ?? []).map((t) => [t.name, t.triggerId])
);
const tagsExistentes = new Set((tagsRes.data.tag ?? []).map((t) => t.name));

const NUEVAS_DLV = [
  "item_category", "motivo", "paso", "zona_envio", "costo_envio", "metodo_envio",
  "departamento", "distrito", "codigo", "descuento", "pregunta", "faq_id",
  "banner_id", "posicion", "total_banners", "destino", "filtro", "valor",
  "lista", "total_items", "tipo_lead", "provincia",
];

for (const nombre of NUEVAS_DLV) {
  const nombreVar = `DLV - ${nombre}`;
  if (variablesExistentes.has(nombreVar)) {
    console.log(`skip  ${nombreVar} (ya existe)`);
    continue;
  }
  await llamar(
    () =>
      tagmanager.accounts.containers.workspaces.variables.create({
        parent: ws,
        requestBody: {
          name: nombreVar,
          type: "v",
          parameter: [
            { type: "integer", key: "dataLayerVersion", value: "2" },
            { type: "boolean", key: "setDefaultValue", value: "false" },
            { type: "template", key: "name", value: nombre },
          ],
        },
      }),
    `variable ${nombreVar}`
  );
}

// Cada entrada: [nombre del evento en dataLayer, parámetros a mandar a GA4]
const EVENTOS = [
  ["view_item", [["item_slug", "{{DLV - item_slug}}"], ["item_name", "{{DLV - item_name}}"], ["item_category", "{{DLV - item_category}}"], ["value", "{{DLV - value}}"]]],
  ["view_item_list", [["lista", "{{DLV - lista}}"], ["filtro", "{{DLV - filtro}}"], ["total_items", "{{DLV - total_items}}"]]],
  ["select_item", [["item_slug", "{{DLV - item_slug}}"], ["item_name", "{{DLV - item_name}}"], ["item_category", "{{DLV - item_category}}"], ["value", "{{DLV - value}}"]]],
  ["remove_from_cart", [["item_slug", "{{DLV - item_slug}}"], ["item_name", "{{DLV - item_name}}"], ["value", "{{DLV - value}}"], ["quantity", "{{DLV - quantity}}"]]],
  ["add_shipping_info", [["value", "{{DLV - value}}"], ["zona_envio", "{{DLV - zona_envio}}"], ["costo_envio", "{{DLV - costo_envio}}"], ["metodo_envio", "{{DLV - metodo_envio}}"], ["departamento", "{{DLV - departamento}}"], ["distrito", "{{DLV - distrito}}"]]],
  ["add_payment_info", [["value", "{{DLV - value}}"], ["metodo_pago", "{{DLV - metodo_pago}}"]]],
  ["checkout_bloqueado", [["motivo", "{{DLV - motivo}}"], ["metodo_pago", "{{DLV - metodo_pago}}"]]],
  ["checkout_error", [["paso", "{{DLV - paso}}"], ["motivo", "{{DLV - motivo}}"], ["metodo_pago", "{{DLV - metodo_pago}}"], ["value", "{{DLV - value}}"]]],
  ["login", [["origen", "{{DLV - origen}}"]]],
  ["login_codigo_enviado", [["origen", "{{DLV - origen}}"]]],
  ["login_error", [["paso", "{{DLV - paso}}"], ["motivo", "{{DLV - motivo}}"], ["origen", "{{DLV - origen}}"]]],
  ["cupon_aplicado", [["codigo", "{{DLV - codigo}}"], ["descuento", "{{DLV - descuento}}"]]],
  ["cupon_rechazado", [["codigo", "{{DLV - codigo}}"], ["motivo", "{{DLV - motivo}}"]]],
  ["faq_abierta", [["pregunta", "{{DLV - pregunta}}"], ["faq_id", "{{DLV - faq_id}}"]]],
  ["banner_click", [["banner_id", "{{DLV - banner_id}}"], ["posicion", "{{DLV - posicion}}"], ["total_banners", "{{DLV - total_banners}}"], ["destino", "{{DLV - destino}}"]]],
  ["video_producto_abierto", [["item_slug", "{{DLV - item_slug}}"], ["item_name", "{{DLV - item_name}}"], ["posicion", "{{DLV - posicion}}"]]],
  ["galeria_zoom", [["item_name", "{{DLV - item_name}}"], ["posicion", "{{DLV - posicion}}"]]],
  ["filtro_blog", [["filtro", "{{DLV - filtro}}"], ["valor", "{{DLV - valor}}"]]],
  ["generate_lead", [["tipo_lead", "{{DLV - tipo_lead}}"], ["departamento", "{{DLV - departamento}}"], ["provincia", "{{DLV - provincia}}"]]],
  // Ya existía en el código desde antes pero nadie lo reenviaba: se dispara
  // cuando el lead de distribuidor no se llega a guardar en la base (aunque
  // el WhatsApp sí se abra), o sea un lead que solo queda en el chat.
  ["distribuidor_lead_error", [["motivo", "{{DLV - motivo}}"]]],
];

for (const [evento, filas] of EVENTOS) {
  const nombreTrigger = `EVT - ${evento}`;
  let triggerId = triggersExistentes.get(nombreTrigger);

  if (triggerId) {
    console.log(`skip  ${nombreTrigger} (ya existe)`);
  } else {
    const trigger = await llamar(
      () =>
        tagmanager.accounts.containers.workspaces.triggers.create({
          parent: ws,
          requestBody: {
            name: nombreTrigger,
            type: "customEvent",
            customEventFilter: [
              {
                type: "equals",
                parameter: [
                  { type: "template", key: "arg0", value: "{{_event}}" },
                  { type: "template", key: "arg1", value: evento },
                ],
              },
            ],
          },
        }),
      `trigger ${nombreTrigger}`
    );
    triggerId = trigger.data.triggerId;
  }

  const nombreTag = `GA4 - ${evento}`;
  if (tagsExistentes.has(nombreTag)) {
    console.log(`skip  ${nombreTag} (ya existe)`);
    continue;
  }

  await llamar(
    () =>
      tagmanager.accounts.containers.workspaces.tags.create({
        parent: ws,
        requestBody: {
          name: nombreTag,
          type: "gaawe",
          firingTriggerId: [triggerId],
          tagFiringOption: "oncePerEvent",
          parameter: [
            { type: "boolean", key: "sendEcommerceData", value: "false" },
            { type: "template", key: "eventName", value: evento },
            { type: "template", key: "measurementIdOverride", value: GA4_MEASUREMENT_ID },
            {
              type: "list",
              key: "eventSettingsTable",
              // content_group va en todos para poder segmentar por sección.
              list: [...filas, ["content_group", "{{JS - Tipo de Pagina}}"]].map(
                ([parameter, parameterValue]) => ({
                  type: "map",
                  map: [
                    { type: "template", key: "parameter", value: parameter },
                    { type: "template", key: "parameterValue", value: parameterValue },
                  ],
                })
              ),
            },
          ],
        },
      }),
    `tag ${nombreTag}`
  );
}

console.log(`\nListo. Eventos nuevos en el workspace "${workspace.name}".`);
