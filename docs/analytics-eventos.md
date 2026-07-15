# Eventos de analítica (dataLayer → GTM → GA4)

Todos los eventos se disparan con `trackEvent()` (`lib/analytics.ts`), que hace
`window.dataLayer.push({ event: "<nombre>", ...parámetros })`. El código ya
está listo — lo que falta es **configurar cada evento dentro de Google Tag
Manager** (contenedor `GTM-K48DWXBM`) para que llegue a GA4
(`G-23Q3WKB4V2`).

No se necesita tocar código para nada de lo de abajo — todo se hace desde la
interfaz web de GTM (tagmanager.google.com).

## Pasos generales (repetir por cada evento de la tabla)

1. **Variables de capa de datos** (una sola vez por parámetro, se reutilizan
   entre eventos): en GTM ve a **Variables → Nueva → Variable de la capa de
   datos**. Nombre sugerido `DLV - <parámetro>`, y en "Nombre de la variable
   de la capa de datos" escribe el nombre exacto del parámetro (ej.
   `item_slug`). Crea una por cada parámetro que aparezca en la tabla de abajo
   (`item_slug`, `item_name`, `value`, `quantity`, `origen`, `transaction_id`,
   `metodo_pago`, `calificacion`, `items`).

2. **Trigger**: **Triggers → Nuevo → Evento personalizado**. En "Nombre del
   evento" escribe el nombre EXACTO del evento (ej. `add_to_cart`, sin
   comillas, respetando mayúsculas/minúsculas).

3. **Tag**: **Tags → Nueva → Google Analytics: Evento de GA4**.
   - Etiqueta de configuración: selecciona (o crea) la de `G-23Q3WKB4V2`.
   - Nombre del evento: mismo nombre que el trigger.
   - Parámetros del evento: agrega cada parámetro de la tabla, con su
     variable de capa de datos correspondiente (`DLV - item_slug`, etc.).
   - Activación: el trigger que creaste en el paso 2.

4. Publica el contenedor (**Enviar → Publicar**) para que los cambios apliquen
   en el sitio real.

---

## Lista de eventos

### `add_to_cart`
- **Dónde se dispara**: botón "Añadir al carrito" en la página de producto.
- **Archivo**: `components/producto/ProductBuyBox.tsx`
- **Parámetros**:
  | Parámetro | Tipo | Descripción |
  |---|---|---|
  | `item_slug` | texto | slug del producto (ej. `suplevet-150g`) |
  | `item_name` | texto | nombre del producto |
  | `value` | número | precio × cantidad |
  | `quantity` | número | cantidad agregada |

### `begin_checkout`
- **Dónde se dispara**: botón "Comprar ahora" en la página de producto (antes
  de ir al carrito).
- **Archivo**: `components/producto/ProductBuyBox.tsx`
- **Parámetros**: iguales a `add_to_cart` (`item_slug`, `item_name`, `value`,
  `quantity`).

### `purchase`
- **Dónde se dispara**: al confirmar exitosamente un pedido en el checkout.
- **Archivo**: `app/checkout/page.tsx`
- **Parámetros**:
  | Parámetro | Tipo | Descripción |
  |---|---|---|
  | `transaction_id` | texto | número de pedido |
  | `value` | número | total pagado (incluye envío) |
  | `metodo_pago` | texto | `tarjeta` \| `yape_plin` \| `transferencia` |
  | `items` | array de objetos | `{ item_slug, item_name, quantity }` por cada producto del pedido — en GTM esto requiere una variable de capa de datos de tipo "Objeto/array" si quieres desglosarlo línea por línea; para un conteo simple basta con `value` y `transaction_id` |
- **Nota**: este es el evento de conversión más importante del sitio (mide
  ventas reales). Vale la pena marcarlo como "Conversión" dentro de GA4
  (Admin → Eventos → marcar `purchase` como conversión — GA4 suele
  reconocerlo automáticamente por el nombre estándar).

### `whatsapp_click`
- **Dónde se dispara**: dos lugares distintos, diferenciados por el parámetro
  `origen`.
  - Botón flotante de WhatsApp (todas las páginas) → `components/layout/WhatsAppFloat.tsx` → `origen: "boton_flotante"`
  - Botón "Veterinarias / Mayoristas" del header → `components/layout/Header.tsx` → `origen: "header_veterinarias"`
- **Parámetros**:
  | Parámetro | Tipo | Descripción |
  |---|---|---|
  | `origen` | texto | `boton_flotante` \| `header_veterinarias` |
- **Sugerencia**: en el tag de GA4, agrega `origen` como parámetro del evento
  para poder filtrar en GA4 cuál botón de WhatsApp genera más clics.

### `submit_review`
- **Dónde se dispara**: al enviar una reseña de producto desde Mis Pedidos
  (portal de clientes).
- **Archivo**: `components/portal/pedidos/ResenaFormDialog.tsx`
- **Parámetros**:
  | Parámetro | Tipo | Descripción |
  |---|---|---|
  | `item_slug` | texto | ID de Shopify del producto reseñado |
  | `item_name` | texto | nombre del producto reseñado |
  | `calificacion` | número | 1 a 5 estrellas |

---

## Agregar un evento nuevo más adelante

En el código: importar `trackEvent` de `@/lib/analytics` y llamarlo en el
`onClick` (u otro handler) del botón que quieras medir:

```tsx
import { trackEvent } from "@/lib/analytics";

trackEvent("nombre_del_evento", { parametro_uno: "valor", parametro_dos: 123 });
```

En GTM: repetir los pasos generales de arriba con el nuevo nombre de evento y
sus parámetros.
