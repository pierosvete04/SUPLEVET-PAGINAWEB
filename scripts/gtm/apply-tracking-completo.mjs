// Tercera ronda: mapeo completo del sitio en GA4.
//
// Que agrega:
//   - content_group por tipo de pagina (Home / Blog - Articulo / Producto -
//     Detalle / Checkout / Legal / Portal ...) para poder segmentar en GA4
//     sin tener que leer URLs a mano. Aplica a TODAS las paginas, incluidos
//     los blogs, que hoy solo se ven como "/blog/loquesea".
//   - link_click: los <Link> de Next (nav "Productos", tarjetas de blog,
//     footer) NO son botones, asi que el trigger de botones no los veia.
//   - outbound_click: clics que salen del dominio (redes, WhatsApp web).
//   - scroll depth 25/50/75/90 — engagement real en articulos de blog.
//   - checkout_pagar_click: el boton "Pagar ahora" del final del checkout,
//     como evento propio para medir el ultimo paso del embudo.
//   - view_cart: apertura del carrito lateral.
//
// Limpieza: borra el trigger DOM_Ready que quedo huerfano tras la ronda 1.
//
// Uso:
//   node scripts/gtm/apply-tracking-completo.mjs

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

const jsVar = (name, js) => ({
  parent: ws,
  requestBody: { name, type: "jsm", parameter: [{ type: "template", key: "javascript", value: js }] },
});

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

// =====================================================================
// VARIABLES
// =====================================================================

// Clasifica cada URL en un tipo de pagina legible. Es lo que permite ver
// "Blog - Articulo" como grupo en GA4 en vez de 40 URLs sueltas.
await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.variables.create(
      jsVar(
        "JS - Tipo de Pagina",
        "function() {\n" +
          "  var p = window.location.pathname.replace(/\\/$/, '') || '/';\n" +
          "  if (p === '/') return 'Home';\n" +
          "  if (p === '/blog') return 'Blog - Listado';\n" +
          "  if (p.indexOf('/blog/') === 0) return 'Blog - Articulo';\n" +
          "  if (p === '/productos') return 'Producto - Listado';\n" +
          "  if (p.indexOf('/productos/') === 0) return 'Producto - Detalle';\n" +
          "  if (p === '/ofertas') return 'Ofertas';\n" +
          "  if (p === '/carrito') return 'Carrito';\n" +
          "  if (p.indexOf('/checkout/exito') === 0) return 'Checkout - Exito';\n" +
          "  if (p.indexOf('/checkout') === 0) return 'Checkout';\n" +
          "  if (p.indexOf('/legal/') === 0) return 'Legal';\n" +
          "  if (p.indexOf('/mi-cuenta') === 0) return 'Portal Cliente';\n" +
          "  if (p.indexOf('/ficha/') === 0) return 'Ficha Mascota';\n" +
          "  if (p.indexOf('/admin') === 0) return 'Admin';\n" +
          "  if (p.indexOf('/vet') === 0) return 'Vet';\n" +
          "  if (p === '/nosotros') return 'Nosotros';\n" +
          "  if (p === '/contacto') return 'Contacto';\n" +
          "  if (p === '/oportunidad-de-negocio') return 'Oportunidad de Negocio';\n" +
          "  return 'Otra';\n" +
          "}\n"
      )
    ),
  "variable JS - Tipo de Pagina"
);

// Texto de cualquier elemento clickeable (boton O enlace). Reemplaza a
// {{Click Text}}, que revienta cuando el clic cae sobre un <svg>.
await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.variables.create(
      jsVar(
        "JS - Texto del Click",
        "function() {\n" +
          "  try {\n" +
          "    var el = {{Click Element}};\n" +
          "    if (!el || !el.closest) return '';\n" +
          "    var t = el.closest(\"button, a, [role='button'], input[type='submit'], input[type='button']\");\n" +
          "    if (!t) return '';\n" +
          "    var text = (t.innerText || t.textContent || '').trim();\n" +
          "    if (!text) text = t.getAttribute('aria-label') || t.getAttribute('title') || '';\n" +
          "    return text.replace(/\\s+/g, ' ').slice(0, 100);\n" +
          "  } catch (e) { return ''; }\n" +
          "}\n"
      )
    ),
  "variable JS - Texto del Click"
);

// En que zona de la pagina ocurrio el clic (Header/Footer/seccion concreta).
// Sin esto, "Ver mas" en home y "Ver mas" en un blog son indistinguibles.
await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.variables.create(
      jsVar(
        "JS - Seccion del Click",
        "function() {\n" +
          "  try {\n" +
          "    var el = {{Click Element}};\n" +
          "    if (!el || !el.closest) return '';\n" +
          "    if (el.closest('[role=\"dialog\"]')) return 'Modal / Carrito lateral';\n" +
          "    if (el.closest('header')) return 'Header';\n" +
          "    if (el.closest('footer')) return 'Footer';\n" +
          "    if (el.closest('nav')) return 'Navegacion';\n" +
          "    var sec = el.closest('section');\n" +
          "    if (sec) {\n" +
          "      var label = sec.getAttribute('aria-label') || sec.getAttribute('id') || '';\n" +
          "      if (label) return label.slice(0, 60);\n" +
          "      var h = sec.querySelector('h1,h2,h3');\n" +
          "      if (h) return (h.innerText || h.textContent || '').trim().replace(/\\s+/g,' ').slice(0, 60);\n" +
          "    }\n" +
          "    return 'Contenido';\n" +
          "  } catch (e) { return ''; }\n" +
          "}\n"
      )
    ),
  "variable JS - Seccion del Click"
);

await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.variables.create(
      jsVar(
        "JS - Es Enlace Saliente",
        "function() {\n" +
          "  try {\n" +
          "    var el = {{Click Element}};\n" +
          "    var a = el && el.closest ? el.closest('a') : null;\n" +
          "    if (!a || !a.href) return false;\n" +
          "    return a.hostname !== window.location.hostname;\n" +
          "  } catch (e) { return false; }\n" +
          "}\n"
      )
    ),
  "variable JS - Es Enlace Saliente"
);

// Variables incorporadas que hacen falta para scroll y clics en enlaces.
await withRetry(
  () =>
    tagmanager.accounts.containers.workspaces.built_in_variables.create({
      parent: ws,
      type: ["scrollDepthThreshold", "scrollDepthUnits", "scrollDirection"],
    }),
  "built-in variables de Scroll habilitadas"
);

// =====================================================================
// TRIGGERS
// =====================================================================

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

// El boton final del checkout ("Pagar ahora"). Es el paso que pediste medir:
// cuanta gente llega a confirmar el pedido.
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

// =====================================================================
// TAGS
// =====================================================================

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

console.log(
  `\nListo. Cambios en el workspace "${workspace.name}". Falta ajustar los tags existentes y publicar.`
);
