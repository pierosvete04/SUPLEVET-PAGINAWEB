# Guía completa: armar Google Tag Manager desde cero (GA4 + Meta Pixel + TikTok Pixel)

Este documento es la checklist para construir, en el contenedor `GTM-K48DWXBM`
(tagmanager.google.com), todo lo necesario para que GA4, Meta Pixel y TikTok
Pixel reciban los eventos que la web ya dispara. El código **no cambia para
nada de esto** — todo se hace en la interfaz web de GTM.

Si tu espacio de trabajo está vacío, esta guía te lleva de cero a publicado.
No hace falta borrar nada primero: como no hay tags/triggers/variables
creados todavía, simplemente vas agregando lo de abajo.

---

## 1. Glosario — qué es cada cosa

GTM tiene 3 piezas. Analogía: un **interruptor de luz**.

### Activador (Trigger)
Es la **condición** — el "cuándo". Responde a: ¿en qué momento se debe
disparar algo? Ejemplos:
- "Cuando se cargue cualquier página" (activador `All Pages`, ya viene por
  defecto en todo contenedor nuevo).
- "Cuando llegue al dataLayer un evento llamado `add_to_cart`" (esto es un
  **Evento personalizado**, el tipo de activador que vamos a usar para casi
  todo en esta guía).

Un activador por sí solo no hace nada — solo describe una condición.

### Etiqueta (Tag)
Es la **acción** — el "qué". Es el código que realmente se ejecuta y envía
datos a un destino externo (GA4, Meta, TikTok). Cada etiqueta necesita
**al menos un activador** que le diga cuándo dispararse. Sin activador, la
etiqueta nunca corre (aunque exista, quedará inactiva).

### Variable
Es un **valor reutilizable**. En vez de escribir el mismo dato a mano en 5
etiquetas distintas, creas una variable una sola vez y la referencias donde
haga falta. Hay dos tipos que vas a usar:
- **Variables incorporadas** (Built-In): vienen listas de fábrica (URL de la
  página, referrer, etc.) — no hay que crearlas, solo activarlas si hace falta.
- **Variable de la Capa de Datos** (Data Layer Variable): la creas tú, para
  "leer" un dato que el código de la web ya empuja al `dataLayer` (ver
  [`lib/analytics.ts`](../lib/analytics.ts)). Por ejemplo, cuando el código
  hace `trackEvent("add_to_cart", { item_slug: "suplevet-150g", value: 99.90 })`,
  necesitas una variable que diga "lee el campo `item_slug` de ese evento" —
  esa variable la puedes usar luego dentro de la etiqueta de GA4, de Meta y
  de TikTok, las 3 al mismo tiempo.

### Espacio de trabajo (Workspace) y Versión
Todo lo que creas vive en un "espacio de trabajo" — es un borrador. Los
cambios **no se aplican al sitio real** hasta que aprietas **Enviar →
Publicar**, que convierte el borrador en una "Versión" live. Puedes crear y
probar todo sin miedo: nada afecta la web hasta ese último paso.

---

## 2. Antes de empezar

Necesitas dos IDs a mano:

- **Meta Pixel ID**: ya lo tienes (el número que sacaste de Events Manager).
- **TikTok Pixel ID**: pendiente — créalo en TikTok Events Manager (Ads
  Manager → Activos → Eventos → Web → Configurar Pixel) cuando quieras seguir
  con esa parte. Puedes hacer primero GA4 + Meta y TikTok después; son
  secciones independientes.

Los eventos que el código ya dispara (no hay que tocar nada aquí, ya existen):
`add_to_cart`, `begin_checkout`, `purchase`, `whatsapp_click`,
`submit_review`. Detalle de cada parámetro en
[`docs/analytics-eventos.md`](./analytics-eventos.md).

---

## 3. Paso 1 — Variables de la Capa de Datos

Ve a **Variables → Variables definidas por el usuario → Nueva** y crea una
por cada fila (tipo: **Variable de la capa de datos**, versión 2):

| Nombre de la variable en GTM | Nombre exacto de la capa de datos |
|---|---|
| `DLV - item_slug` | `item_slug` |
| `DLV - item_name` | `item_name` |
| `DLV - value` | `value` |
| `DLV - quantity` | `quantity` |
| `DLV - origen` | `origen` |
| `DLV - transaction_id` | `transaction_id` |
| `DLV - metodo_pago` | `metodo_pago` |
| `DLV - calificacion` | `calificacion` |

Son 8 variables, una sola vez — se reutilizan en todas las etiquetas de GA4,
Meta y TikTok de abajo.

---

## 4. Paso 2 — Activadores (Triggers)

Ve a **Triggers → Nuevo**. Tipo: **Evento personalizado**. Crea uno por cada
fila (el nombre del evento debe ser EXACTO, sin comillas, respetando
mayúsculas/minúsculas):

| Nombre del activador en GTM | Nombre del evento |
|---|---|
| `EVT - add_to_cart` | `add_to_cart` |
| `EVT - begin_checkout` | `begin_checkout` |
| `EVT - purchase` | `purchase` |
| `EVT - whatsapp_click` | `whatsapp_click` |
| `EVT - submit_review` | `submit_review` |

El activador **`All Pages`** ya existe por defecto (no lo crees, ya está) —
lo vas a usar para las etiquetas "base" de Meta y TikTok (el Pixel necesita
dispararse en cada página, no solo en eventos puntuales).

---

## 5. Paso 3 — Etiquetas de GA4

### 5.1 Tag de configuración (una sola vez)
**Tags → Nueva** → tipo **Google Analytics: Configuración de GA4**.
- ID de medición: `G-23Q3WKB4V2`
- Activación: `All Pages`
- Nombre: `GA4 - Configuración`

### 5.2 Tags de evento (una por evento)
**Tags → Nueva** → tipo **Google Analytics: Evento de GA4**, para cada fila:

| Nombre del tag | Nombre del evento GA4 | Activador | Parámetros del evento |
|---|---|---|---|
| `GA4 - add_to_cart` | `add_to_cart` | `EVT - add_to_cart` | `item_slug`, `item_name`, `value`, `quantity` |
| `GA4 - begin_checkout` | `begin_checkout` | `EVT - begin_checkout` | `item_slug`, `item_name`, `value`, `quantity` |
| `GA4 - purchase` | `purchase` | `EVT - purchase` | `transaction_id`, `value`, `metodo_pago` |
| `GA4 - whatsapp_click` | `whatsapp_click` | `EVT - whatsapp_click` | `origen` |
| `GA4 - submit_review` | `submit_review` | `EVT - submit_review` | `item_slug`, `item_name`, `calificacion` |

En cada uno: "Etiqueta de configuración" = `GA4 - Configuración`. En
"Parámetros del evento", el nombre del parámetro es el mismo texto de la
tabla, y el valor es la variable `DLV - <mismo nombre>` del paso 1.

Marca `purchase` como conversión en GA4 (Admin → Eventos → Marcar como
conversión) una vez que empiece a llegar tráfico real.

---

## 6. Paso 4 — Etiquetas de Meta Pixel

### 6.1 Instalar la plantilla
**Tags → Nueva** → "Descubre más tipos de etiquetas en la Galería" → busca
**"Facebook Pixel"** (la plantilla oficial de Meta) → Agregar al espacio de
trabajo.

### 6.2 Tag base (PageView — una sola vez)
**Tags → Nueva** → tipo **Facebook Pixel**.
- ID de Pixel: pega el ID que ya tienes.
- Tipo de evento: `PageView`
- Activación: `All Pages`
- Nombre: `Meta - Base (PageView)`

### 6.3 Tags de evento (mapeo a eventos estándar de Meta)

| Nombre del tag | Evento de Meta | Activador | Parámetros del objeto de datos |
|---|---|---|---|
| `Meta - AddToCart` | `AddToCart` | `EVT - add_to_cart` | `content_name` = `DLV - item_name`, `content_ids` = `DLV - item_slug`, `value` = `DLV - value`, `currency` = `PEN` (texto fijo) |
| `Meta - InitiateCheckout` | `InitiateCheckout` | `EVT - begin_checkout` | igual que arriba |
| `Meta - Purchase` | `Purchase` | `EVT - purchase` | `value` = `DLV - value`, `currency` = `PEN` (texto fijo) |

En cada tag: ID de Pixel = el mismo de la base. `currency` se escribe literal
`PEN` (no hace falta variable — nunca cambia). No hay evento estándar de Meta
para `whatsapp_click` ni `submit_review`; si más adelante quieres medirlos en
Meta, se mapean como evento personalizado (`Contact`, por ejemplo) — no es
necesario para el lanzamiento inicial.

---

## 7. Paso 5 — Etiquetas de TikTok Pixel

Mismo patrón que Meta.

### 7.1 Instalar la plantilla
**Tags → Nueva** → Galería → busca **"TikTok Pixel"** (plantilla oficial de
TikTok) → Agregar al espacio de trabajo.

### 7.2 Tag base
**Tags → Nueva** → tipo **TikTok Pixel**.
- ID de Pixel de TikTok: pégalo cuando lo tengas.
- Tipo de evento: `PageView`
- Activación: `All Pages`
- Nombre: `TikTok - Base (PageView)`

### 7.3 Tags de evento

| Nombre del tag | Evento de TikTok | Activador | Parámetros |
|---|---|---|---|
| `TikTok - AddToCart` | `AddToCart` | `EVT - add_to_cart` | `content_id` = `DLV - item_slug`, `content_name` = `DLV - item_name`, `value` = `DLV - value`, `currency` = `PEN` |
| `TikTok - InitiateCheckout` | `InitiateCheckout` | `EVT - begin_checkout` | igual que arriba |
| `TikTok - CompletePayment` | `CompletePayment` | `EVT - purchase` | `value` = `DLV - value`, `currency` = `PEN` |

---

## 8. Publicar

**Enviar** (arriba a la derecha) → escribe un nombre de versión (ej. "GA4 +
Meta + TikTok — setup inicial") → **Publicar**. Antes de este paso nada de
esto afecta la web real.

---

## 9. Cómo verificar que sí está funcionando

No hace falta esperar a ver datos en los reportes (tardan horas). Usa esto
para confirmar en el momento:

1. **Modo Vista previa de GTM** (botón "Vista previa" arriba, antes de
   publicar): abre tu sitio en una pestaña conectada y muestra en tiempo real
   qué activadores y etiquetas se dispararon al hacer clic en cada botón.
2. **Extensión "Meta Pixel Helper"** (Chrome Web Store): instálala, navega el
   sitio, agrega un producto al carrito — debe mostrar el pixel activo y el
   evento `AddToCart` disparado.
3. **Extensión "TikTok Pixel Helper"**: mismo concepto para TikTok.
4. **GA4 → Informes → Tiempo real** (o **DebugView** si activas el modo
   debug): deberías ver los eventos apareciendo mientras navegas.

---

## 10. Resumen — todo lo que hay que crear

- [ ] 8 variables de capa de datos (paso 3)
- [ ] 5 activadores de evento personalizado (paso 4) — `All Pages` ya existe
- [ ] 1 tag de configuración GA4 + 5 tags de evento GA4 (paso 5)
- [ ] 1 tag base Meta Pixel + 3 tags de evento Meta (paso 6)
- [ ] 1 tag base TikTok Pixel + 3 tags de evento TikTok (paso 7)
- [ ] Publicar el contenedor (paso 8)
- [ ] Verificar con Vista previa + Pixel Helpers (paso 9)
