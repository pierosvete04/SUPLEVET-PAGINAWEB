# Auditoría UI/UX — Pestaña Créditos (panel vendedor + panel admin)

**Fecha:** 2026-08-06
**Alcance:** `page-creditos` en los dos paneles, sus dos modales de cobro (total y parcial), los KPIs, la búsqueda, el estado vacío y el listado de tarjetas.
**Método:** lectura de código (HTML/CSS/JS). No se ejecutó la app; los cálculos de contraste son de los valores hex literales del código.

**Archivos auditados**
- `vendedor/index.html:325-340` (página), `:677-825` (modales)
- `vendedor/assets/js/creditos.js` (completo, 489 líneas)
- `admin/index.html:226-241` (página), `:1679-1766` (modal parcial)
- `admin/assets/js/dashboard.js:632-1140` (render + cobros)
- `vendedor/assets/css/app.css:260-262, 565-598`, `admin/assets/css/app.css`

---

> **Estado (2026-08-06):** implementado el módulo compartido `assets/js/cobros.js`.
> Quedan corregidos: **A1** (descuadre en Registrar Visita), **A2** (cobro en dinero),
> **A3** (vista previa), **A4** (parcial pre-rellenado), **A5** y **#2** (precio 0),
> **A6** (método de pago en el admin), **#6** (borrado del input al fallar) y la
> deuda estructural de las cuatro copias. El resto de la lista sigue pendiente.

## Resumen por severidad

| # | Hallazgo | Sev. | Vendedor | Admin |
|---|----------|------|----------|-------|
| 1 | Los errores de validación del modal se pintan **detrás** del overlay | CRÍTICO | ✗ | ✗ |
| 2 | Cobro parcial en productos registra **S/ 0.00** si falta `precio_unitario` | CRÍTICO | ✗ | ✓ ok |
| 3 | El método de pago (obligatorio) **no es operable con teclado** | CRÍTICO | ✗ | ✗ |
| 4 | Contraste blanco sobre naranja/rojo: 2.2–3.8:1 (WCAG pide 4.5) | ALTO | ✗ | ✗ |
| 5 | "Cobrado" total se confirma **sin ver de qué crédito se trata** | ALTO | ✗ | ✗ |
| 6 | El error borra lo que el usuario escribió (`campo.value=''`) | ALTO | ✗ | ✗ |
| 7 | Sin escape de HTML en el listado del vendedor | ALTO | ✗ | ✓ ok |
| 8 | KPI "POR VENCER": el admin cuenta 5 días y rotula "próx. 15 días" | ALTO | 15d | 5d |
| 9 | Estado vacío miente cuando es una búsqueda sin resultados | ALTO | ✗ | ✗ |
| 10 | Desfase de un día entre el orden de la lista y el texto de la tarjeta | MEDIO | ✗ | ✓ ok |
| 11 | Fecha de cobro admite fechas futuras | MEDIO | ✗ | ✗ |
| 12 | Los KPIs Vencidos / Por vencer no filtran (afordancia muerta) | MEDIO | ✗ | ✗ |
| 13 | "Vencido hace 1 días" / "Vence en 1 días" | MEDIO | ✗ | ✗ |
| 14 | El vendedor no ve la nota del saldo tras un cobro parcial | MEDIO | ✗ | ✓ ok |
| 15 | Jerarquía invertida: "Reporte PDF" es el botón primario | MEDIO | ✗ | ✗ |
| 16 | Botón × de quitar imagen: 20×20 px, sin nombre accesible | MEDIO | ✗ | ✗ |
| 17 | Etiquetas y nomenclatura inconsistentes entre paneles | BAJO | — | — |
| 18 | Emoji usado como icono conviviendo con el sprite SVG | BAJO | ✗ | ✗ |
| 19 | Búsqueda sin label, sin contador de resultados, sin limpiar | BAJO | ✗ | ✗ |
| 20 | El `<select>` de vendedor del admin no tiene etiqueta visible | BAJO | — | ✗ |

---

## CRÍTICO

### 1. Los errores de validación se pintan detrás del modal

`setSt()` escribe siempre en `#st-global`, que es un div en flujo normal al principio de la página:

- `vendedor/index.html:110` y `admin/index.html:156` → `<div id="st-global" role="status" aria-live="polite">`
- `vendedor/assets/css/app.css:272` → `.mo{position:fixed;inset:0;background:rgba(26,45,74,.5);z-index:200}`

Todas las validaciones del cobro llaman a `setSt(...,'er')`:
`creditos.js:228-230`, `creditos.js:403-417`, `dashboard.js:923-925`.

**Qué ve el usuario:** abre "Registrar cobro", no elige método de pago, pulsa Confirmar → **no pasa absolutamente nada**. El mensaje existe, pero está debajo de un overlay opaco con `z-index:200`.

Y no hay salida por audio tampoco: `a11y.js:264-274` marca `aria-hidden="true"` + `inert` en todos los hermanos de `<body>` al abrir el modal, y `#st-global` es uno de ellos. El lector de pantalla tampoco lo anuncia.

**Arreglo:** los errores del formulario van dentro del modal, junto al campo que falla. Ya existe el patrón en la casa (`.svui-error`, `app.css:716-721`). Mínimo viable: un `<div class="svui-error" role="alert">` bajo cada campo obligatorio del modal, y reservar `setSt` para los avisos de página.

---

### 2. Un cobro parcial en productos puede registrar S/ 0.00

`creditos.js:308-342` — versión vendedor:

```js
var precio = Number(v.precio_unitario) || 0;   // ← 0 si la fila no lo trae
...
var pag = r2(u * precio);                       // ← 0
```

`dashboard.js:981-986` — versión admin, que **sí** tiene el respaldo:

```js
function _cpPrecio(v){
  var precio=Number(v.precio_unitario||0);
  if(!(precio>0)&&cant>0) precio=Number(v.total||0)/cant;   // deriva del total
  return precio;
}
```

El comentario de `dashboard.js:956-957` dice literalmente *"Esta lógica es gemela de la del panel de vendedores. Si cambias una, cambia la otra."* — y ya divergieron.

**Consecuencia con una fila sin `precio_unitario`:** el vendedor cobra 3 de 10 unidades, la fila original se actualiza a `total = 0`, y se crea un saldo con el importe íntegro. El dinero cobrado desaparece del reporte y la deuda del cliente no baja. El comentario de `creditos.js:305-307` reconoce que existen 6 filas históricas donde `cantidad × precio ≠ total`.

**Arreglo:** portar `_cpPrecio` a `creditos.js` — o, mejor, extraer `cpCalcularReparto` a un archivo compartido, que es la causa raíz.

---

### 3. El método de pago no se puede elegir con teclado

El selector es un `<div onclick>` con un dropdown construido a mano:

- `vendedor/index.html:727-733` (y `:786-792`), `admin/index.html:1729-1735`
- `creditos.js:54-81` / `dashboard.js:849-903`

No tiene `role="combobox"`, las opciones no tienen `role="option"`, no hay `tabindex`, no responde a Enter/Espacio/flechas, y `a11y.js:22-35` no incluye estos elementos en su lista `CLICKABLE`, así que tampoco los repara el observador.

El campo es **obligatorio** (`creditos.js:228`). Es decir: quien navega con teclado no puede completar un cobro. Ni total ni parcial. En ninguno de los dos paneles.

**Arreglo:** o se convierte en `<button aria-expanded aria-controls>` + `<div role="listbox">` con opciones enfocables y navegación por flechas, o —más barato y probablemente mejor aquí— un `<select>` nativo con el logo pintado al lado. El logo bonito no compensa perder el campo entero.

---

## ALTO

### 4. Contraste insuficiente en las tarjetas de urgencia

Los valores están en `creditos.js:167-189` y duplicados en `dashboard.js:685-701`. Ratios calculados sobre los hex del código:

| Fondo | Texto | Ratio | WCAG AA (4.5:1) |
|-------|-------|-------|-----------------|
| `#f97316` vencido 1-7d | `#fff` | **2.80** | ✗ |
| `#f97316` | `rgba(255,255,255,.8)` sub 11px | **≈2.2** | ✗ |
| `#ef4444` vencido 8-15d | `#fff` | **3.76** | ✗ |
| `#ef4444` | `rgba(255,255,255,.75)` sub 11px | **≈3.0** | ✗ |
| `#dc2626` vencido +15d | `#fff` | 4.83 | ✓ |
| `#dc2626` | `rgba(255,255,255,.75)` sub 11px | **3.27** | ✗ |
| `#fef3c7` por vencer | `#a16207` sub 11px | **4.39** | ✗ (roza) |
| `#fef3c7` | `#d97706` importe 15px/700 | **2.86** | ✗ |
| `var(--wh)` normal | `#d97706` importe 15px/700 | **3.19** | ✗ |

Nada de esto pasa a 15px en negrita: el umbral de "texto grande" es 18.66px bold, y el importe está en 15px.

Y el contexto lo agrava: la CSS del propio proyecto (`app.css:605-607`) explica que esto se usa *"en la calle, de pie y con una mano"*. Bajo el sol, 2.8:1 en un importe de dinero no se lee.

**Arreglo:** bajar los fondos de urgencia a tonos 600/700 (`#ea580c` da 3.9, `#c2410c` da 5.2 con blanco) y subir la opacidad del subtexto de .75/.8 a 1 con un tono sólido. El importe en la tarjeta amarilla debería ser `#92400e` (7.9:1), no `#d97706`.

### 5. El cobro total se confirma a ciegas

`marcarPagado()` (`creditos.js:214-221`, `dashboard.js:905-912`) sólo guarda el id en un hidden y abre el modal. El modal (`vendedor/index.html:768-825`) **no muestra ni la veterinaria, ni el producto, ni el importe**. Sólo dice:

> Se marcará este crédito como **cobrado en su totalidad**.

¿Cuál crédito? El modal de cobro parcial sí lo muestra (`cp-vete`, `cp-desc`, `index.html:687-688`). El total, que es la acción más irreversible de la pestaña, no.

En una lista densa de tarjetas de colores, con el dedo, tocar la fila de al lado es cuestión de tiempo. Y `estado:'✅ Pagado'` no tiene deshacer en la UI.

**Arreglo:** el mismo bloque de contexto que ya existe en el modal parcial, con el importe en grande. Y el botón de confirmar debería decir el importe: `Confirmar cobro de S/ 1,240.00`.

### 6. El error borra lo que el usuario escribió

`creditos.js:407-414`:

```js
if(esMonto && bruto > Number(v.total)){
  setSt('La deuda es de '+money(v.total)+'...','er');
  campo.value='';           // ← se le borra lo tecleado
  campo.focus(); cpPreview(); return;
}
```

Combinado con el hallazgo #1 (el mensaje no se ve), lo que percibe el usuario es: *escribí un número, pulsé confirmar, y el campo se vació solo*. Sin explicación.

**Arreglo:** conservar el valor, seleccionarlo (`campo.select()`) y mostrar el error inline bajo el campo.

### 7. Sin escape de HTML en el listado del vendedor

`creditos.js:196-207` interpola directo en `innerHTML`: `v.veterinaria`, `v.doctora`, `v.zona`, `v.producto`. El admin sí escapa todo (`dashboard.js:706-714` usa `esc()`), y `esc()` está disponible en el vendedor (`vendedor/assets/js/config.js:19`) — simplemente no se usa aquí (0 llamadas en todo el archivo).

Una veterinaria llamada `Clínica <San Roque>` rompe la tarjeta. Y como los nombres de veterinaria los escriben los propios vendedores desde la app, es una vía de inyección entre usuarios, no sólo un fallo de render.

**Arreglo:** envolver los cuatro campos en `esc()`, igual que el admin.

### 8. El KPI "POR VENCER" cuenta cosas distintas en cada panel

| | Ventana contada | Rótulo | Color |
|---|---|---|---|
| Vendedor (`creditos.js:154`) | **15 días** | "prox. 15 dias" | ámbar (`sv-w`) |
| Admin (`dashboard.js:673`) | **5 días** (`DIAS_POR_VENCER_REPORTE`) | "próx. 15 días" | azul marca (`sv-b`) |

El rótulo del admin es directamente falso. Y aunque se corrigiera, el mismo indicador da dos números distintos según quién mire — el vendedor reporta 8 por vencer, el admin ve 3, y nadie sabe quién tiene razón.

Encima, el umbral del color de la tarjeta es un tercer número: `dias <= 5` (`creditos.js:181`). Así que en el panel del vendedor un crédito puede contar como "por vencer" en el KPI y pintarse blanco/normal en la lista.

**Arreglo:** un solo `DIAS_POR_VENCER` compartido, usado por el KPI, por el color de la tarjeta y por el PDF. Y color semántico igual en ambos: ámbar, no azul de marca (el azul de marca no significa "atención").

### 9. El estado vacío miente cuando no hay resultados de búsqueda

`creditos.js:211` y `dashboard.js:723` devuelven siempre el mismo texto:

> **Sin créditos pendientes.** Todo lo que vendiste a crédito ya está cobrado.

Pero ese mismo bloque aparece cuando hay 40 créditos pendientes y el usuario escribió "Marisol" en el buscador. El mensaje afirma lo contrario de la realidad.

**Arreglo:** dos estados distintos —ver la tabla de copy más abajo—, y en el caso de búsqueda, un botón para limpiar el filtro.

---

## MEDIO

### 10. Desfase de un día entre el orden y el texto

En el vendedor conviven dos cálculos que no son inversos exactos:

```js
// orden (creditos.js:140):    ceil((hoy - fecha_cobro)/86400000)
// tarjeta (creditos.js:163):  ceil((fecha_cobro - hoy)/86400000)
```

`Math.ceil(-x) !== -Math.ceil(x)` cuando hay fracción de día, y siempre la hay porque `new Date()` incluye la hora. Resultado: dos créditos con el mismo texto "Vencido hace 3 días" pueden aparecer en orden invertido, o una tarjeta puede colarse por encima de otra más vencida.

El admin usa los helpers `diasDesde`/`diasHasta` en los dos sitios (`dashboard.js:662-663, 681`) y no tiene el problema.

**Arreglo:** portar los helpers del admin al vendedor y calcular el número **una sola vez** por venta, reutilizándolo para ordenar, contar el KPI, pintar el color y escribir el texto.

### 11. La fecha de cobro admite el futuro

`cp-fecha` y `mp-fecha` (`vendedor/index.html:721, 781`; `admin/index.html:1722`) son `<input type="date">` sin `max`. Se puede registrar un cobro con fecha 2027. No hay validación en JS tampoco: `gel('cp-fecha').value||hoy()` acepta lo que sea.

**Arreglo:** `max="<hoy>"` puesto al abrir el modal, más una comprobación en `confirmar*`.

### 12. Los KPIs parecen filtros y no lo son

"VENCIDOS 12" y "POR VENCER 4" son las dos preguntas que un cobrador se hace, y las dos tarjetas están justo encima de la lista. Todo el mundo va a tocarlas. No hacen nada.

**Arreglo:** convertirlas en filtros conmutables (`aria-pressed`), o al menos añadir unos chips "Todos / Vencidos / Por vencer" sobre el listado. Es el cambio con mejor relación valor/esfuerzo de toda la auditoría.

### 13. Plurales rotos

`creditos.js:191` y `dashboard.js:702`: `'Vencido hace '+diasAbs+' días'` → **"Vencido hace 1 días"**, **"Vence en 1 días"**. Y `'· '+v.cantidad+' uds'` → "1 uds".

También `'0 días'` para el crédito que vence hoy, cuando lo que hay que decir es "Vence hoy" — que es justamente el día que importa.

### 14. El vendedor no ve por qué su crédito cambió de importe

El admin pinta `v.notas` en la tarjeta (`dashboard.js:714`). El vendedor no.

Justo después de un cobro parcial, `creditos.js:473` crea la fila del saldo con `notas: 'Saldo tras Cobro parcial: 3 de 10 unidades el 06/08/2026'`. Es exactamente la explicación que el vendedor necesita para entender por qué la tarjeta que veía en S/ 1,000 ahora dice S/ 700 y tiene la misma fecha de vencimiento. Y es la única persona que no la ve.

### 15. Jerarquía invertida

`vendedor/index.html:329` y `admin/index.html:229`: `class="btn btn-p"` (primario) en **"📄 Reporte PDF"**. Los botones que hacen el trabajo real de la pestaña —registrar cobros— son `btn-sm` sin variante, dentro de las tarjetas.

El botón de más peso visual de la página es el que exporta un PDF. Debería ser `btn-s`.

### 16. Botón de quitar imagen: 20×20 px y sin nombre

`creditos.js:34`: `width:20px;height:20px` con `×` como único contenido, y sin `aria-label`. La propia CSS del proyecto (`app.css:599-647`) establece 44px como mínimo táctil y define `.icon-btn` para exactamente este caso — pero este botón se genera en JS con estilos inline y no usa la clase.

**Arreglo:** `class="icon-btn"` + `aria-label="Quitar imagen"` + quitar los estilos inline de tamaño.

---

## BAJO — consistencia y copy

### 17. Nomenclatura: tres nombres para el mismo sitio

| Ubicación | Texto |
|---|---|
| Nav lateral vendedor (`index.html:99`) | "Créditos pendientes" |
| Nav inferior vendedor (`index.html:535`) | "Créditos" |
| Título página vendedor (`index.html:327`) | "Créditos pendientes" |
| Nav lateral admin (`index.html:114`) | "Créditos" |
| Título página admin (`index.html:228`) | "Créditos **P**endientes" ← Title Case, incorrecto en español |

Otras divergencias: placeholder "Buscar **por** veterinaria…" (vendedor) vs "Buscar veterinaria…" (admin); "Imagen de pago \*" (vendedor) vs "📎 Comprobantes de pago (al menos 1)" (admin) para el mismo campo, con dos convenciones distintas de obligatoriedad; el vendedor tiene `kicker` ("Cobranzas") y el admin no.

Además, el campo del vendedor se llama "Imagen de pago" pero acepta `.pdf` (`index.html:807`).

### 18. Emoji como icono

`✅ Cobrado`, `💰 Parcial`, `📄 Reporte PDF`, `📅 ¿En qué fecha cobraste?`, `📈 ¿A quién se entregó el efectivo?` — mientras la navegación usa el sprite SVG (`<use href="#i-tarjeta">`). Además, `📈` (gráfico ascendente) no tiene relación con entregar efectivo.

### 19. Búsqueda sin acabar

`srch-cred` (ambos paneles): sin `<label>` ni `aria-label`, sin botón de limpiar, sin `type="search"`, sin contador de resultados, y `oninput="rCreditos()"` sin debounce — cada tecla recorre y repinta toda la lista.

### 20. Filtro de vendedor sin etiqueta

`admin/index.html:237`: `<select id="cr-filtro-vend">` con estilos inline y sin label. La primera opción "Todos los vendedores" hace de etiqueta implícita, que se pierde en cuanto eliges uno.

---

## Reescritura de copy propuesta

| Dónde | Actual | Propuesto | Por qué |
|---|---|---|---|
| Botón tarjeta | `✅ Cobrado` | `Registrar cobro` | "Cobrado" es un estado, no una acción; el botón no marca, abre un formulario |
| Botón tarjeta | `💰 Parcial` | `Cobro parcial` | Un adjetivo suelto no dice qué va a pasar |
| Título modal | `✅ Registrar cobro total` | `Registrar cobro completo` | Y que coincida con el botón que lo abre |
| Título modal | `💰 Registrar cobro` | `Registrar cobro parcial` | Hoy los dos modales compiten por el mismo nombre |
| Confirmar total | `Confirmar` | `Confirmar cobro de S/ 1,240.00` | El importe en el botón es la última defensa antes de un cambio irreversible |
| Aviso modal total | "Se marcará este crédito como cobrado en su totalidad." | "Vas a registrar el cobro completo de **S/ 1,240.00** de **Clínica San Roque**." | Voz activa, segunda persona, y dice de qué crédito habla |
| Vacío (sin créditos) | "Sin créditos pendientes. Todo lo que vendiste a crédito ya está cobrado." | *(se mantiene — está bien)* | Explica el porqué y cierra en positivo |
| Vacío (búsqueda) | *(reusa el anterior)* | "Ningún crédito coincide con «marisol». Revisa cómo lo escribiste o **limpia la búsqueda**." | Hoy afirma algo falso |
| Vencido | "Vencido hace 1 días" | "Vencido ayer" / "Vencido hace 3 días" | Plural y caso especial |
| Por vencer | "Vence en 0 días" | "Vence hoy" | 0 días es el día que más importa |
| Por vencer | "Vence en 1 días" | "Vence mañana" | Plural |
| Error método | "Selecciona el método de pago" | *(mismo texto, pero **bajo el campo**)* | El problema no es el texto, es dónde aparece |
| Error monto | "La deuda es de S/ 700. No puedes registrar más que eso." | "El máximo es S/ 700.00, que es lo que queda pendiente." | Sin "no puedes"; da el límite y el porqué |
| Error unidades | "El crédito es de 10 unidades. No puedes registrar más que eso." | "El máximo son 10 unidades, que es lo que queda pendiente." | Igual |
| Error imagen | "Adjunta al menos una imagen del pago" | "Adjunta el comprobante del pago (al menos 1 foto o PDF)." | El campo acepta PDF; "imagen" lo contradice |
| KPI | `POR VENCER · prox. 15 dias` | `POR VENCER · próx. 5 días` | Acentos, y que el número sea el real |
| Label admin | `¿Cómo pagaron?` | `¿Cómo pagó el cliente?` | Sujeto ambiguo desde el panel admin |
| Receptor | `📈 ¿A quién se entregó el efectivo?` | `¿A quién se entregó el efectivo?` | El emoji no significa nada aquí |

Nota de estilo transversal: en español va **mayúscula sólo inicial** en títulos ("Créditos pendientes"), no Title Case. El admin lo incumple en el H1.

---

## Orden de arreglo sugerido

**Bloque 1 — la pestaña está rota, no sólo mejorable**
1. Errores dentro del modal (#1) — sin esto, el formulario parece no responder
2. `_cpPrecio` en el vendedor (#2) — hay dinero que se pierde
3. `esc()` en el listado del vendedor (#7) — 4 líneas
4. Unificar `DIAS_POR_VENCER` (#8) — el rótulo del admin miente hoy

**Bloque 2 — errores de cobro esperando a pasar**
5. Contexto (veterinaria + importe) en el modal de cobro total (#5)
6. No borrar el input al fallar la validación (#6)
7. Contrastes de las tarjetas de urgencia (#4)
8. `max` en las fechas de cobro (#11)

**Bloque 3 — hacerla buena**
9. KPIs como filtros (#12) — el mejor retorno de la lista
10. Selector de método de pago accesible (#3)
11. Estado vacío de búsqueda (#9) y plurales (#13)
12. Nota del saldo visible para el vendedor (#14)
13. Jerarquía del botón PDF (#15), copy de botones y títulos (#17-20)

---
---

# Anexo — "Cobro de crédito" dentro de Registrar Visita

**Archivos:** `vendedor/assets/js/registro-visita.js:451-607, 917-995` · `admin/assets/js/visitas.js:447-559, 796-897`

Es el **mismo cobro de crédito**, hecho desde otra pantalla, con una cuarta implementación distinta del reparto. Resumen de lo que hay hoy:

| | Pestaña Créditos | Registrar Visita |
|---|---|---|
| Cobro en unidades | ✓ | ✓ |
| **Cobro en dinero** | ✓ `cpSetModo('monto')` | **✗ no existe** |
| Vista previa del reparto | ✓ `cpPreview()` con `role="status"` | ✗ |
| Aviso "monto aproximado" | ✓ | ✗ (no aplica sin modo dinero) |
| Saldo = total original − cobrado | ✓ | **✗ = cantPend × precio** |
| Respaldo si falta `precio_unitario` | vendedor ✗ / admin ✓ | vendedor ✗ / admin ✓ |
| Método de pago obligatorio | ✓ ambos | vendedor ✓ / **admin ✗** |

---

## A1. El dinero no se conserva (CRÍTICO, los dos paneles)

La pestaña Créditos documenta esto explícitamente en `creditos.js:304-307`:

> *"El saldo en dinero se calcula SIEMPRE restando del total original, así el dinero se conserva aunque la fila no cumpla cantidad × precio = total (hay 6 filas históricas en esa situación)."*

Registrar Visita hace justo lo contrario. Recalcula **las dos** filas desde el precio unitario:

```js
// vendedor/registro-visita.js:963  (fila cobrada)
total: cantCob*precio,
// vendedor/registro-visita.js:984  (fila del saldo)
total: cantPend*precio,

// admin/visitas.js:861 y :888 — idéntico
```

**Ejemplo con una fila con descuento** (cantidad 10, precio 100, total 950):

| | Cobrado | Saldo | Suma | Original |
|---|---|---|---|---|
| Pestaña Créditos, 3 uds | 300 | **650** | 950 ✓ | 950 |
| Registrar Visita, 3 uds | 300 | **700** | 1000 ✗ | 950 |

Se inventan S/ 50 que nadie cobró.

Y hay un caso peor, porque no requiere ni siquiera un cobro parcial: **"Cobrar todo"** también sobrescribe el total. `mvCobrarTodo` → `_mvAgregarCobro(c, c.cantidad, …)` → `total: 10*100 = 1000`. Un crédito de S/ 950 se registra como cobro de S/ 1,000 sin que el usuario toque un solo campo. En la pestaña Créditos ese mismo cobro total (`confirmarMarcarPagado`, `creditos.js:236-247`) **no toca `total`** — y hace bien.

**Arreglo:** en el cobro total, no escribir `total` ni `cantidad`. En el parcial, `montoSaldo = totalOriginal − montoPagado`, exactamente como `cpCalcularReparto`.

## A2. Falta el modo "en dinero" (lo que pediste)

`mvConfirmarParcial` (`registro-visita.js:549-573`) y `rvConfirmarParcial` (`visitas.js:522-544`) solo leen un input de unidades. No hay conmutador.

En la calle pasa lo mismo aquí que en la pestaña Créditos: *"me dieron S/ 500 de los S/ 1,000"*. Hoy el vendedor tiene que dividir de cabeza para traducirlo a unidades — y si el precio no es redondo, no puede. Peor: el panel de cobro parcial de la visita está **al lado** del cliente, que es justo el momento en que te pagan en efectivo una cifra suelta.

**Arreglo:** el mismo par de botones `.cp-modo-btn` ("En productos" / "En dinero") que ya existe y está estilado (`app.css:565-580`), con `aria-pressed`, alimentando `cpCalcularReparto`. La lógica ya está escrita; aquí solo falta llamarla.

## A3. Sin vista previa del reparto

La pestaña Créditos muestra en vivo *"Se registra S/ 300.00 como cobrado y quedan S/ 650.00 pendientes (7 de 10 unidades)"* (`cpPreview`, `creditos.js:345-370`), en un `role="status"` que el lector de pantalla anuncia.

En Registrar Visita escribes las unidades y no ves ningún importe hasta después de confirmar, cuando aparece un toast (`registro-visita.js:603`). Confirmas sin saber cuánto dinero estás registrando.

Al añadir el modo dinero esto pasa de deseable a necesario: es el aviso de `aproximado` el que explica por qué 3 unidades salieron de S/ 500.

## A4. "Parcial" viene pre-rellenado con el total (ALTO, los dos paneles)

```js
// registro-visita.js:514  y  visitas.js:500
'<input type="number" id="cred-cant-'+c.id+'" min="1" max="'+c.cantidad+'" value="'+c.cantidad+'" …
```

Pulsas **"✂️ Parcial"**, se abre el panel, pulsas **"✓ Confirmar"** sin tocar nada → se registra un cobro **total**. El botón que dice "parcial" hace lo contrario de lo que anuncia si no editas el campo.

**Arreglo:** campo vacío con `placeholder="Ej: 3"`, como en el modal de la pestaña Créditos (`index.html:703`).

## A5. Precio 0 → cobro de S/ 0.00 (vendedor)

`registro-visita.js:596-597`: `precio: c.precio_unitario||0` y `total: cantCob*(c.precio_unitario||0)`. Sin respaldo.

El admin sí lo cubre y además **aborta** en vez de guardar basura (`visitas.js:849-854`):

```js
if(!(precio>0) && m.credObj){ precio = … m.credObj.total/m.credObj.cantidad; }
if(!(precio>0)) return Promise.reject(new Error('Precio inválido para el cobro del crédito '+m.credId));
```

Es exactamente la misma divergencia que el hallazgo #2 de la auditoría, replicada en esta pantalla. En el vendedor, un "Cobrar todo" sobre una fila sin `precio_unitario` marca el crédito como Pagado con `total = 0`: la deuda desaparece y el ingreso nunca se registra.

## A6. El admin permite guardar un cobro sin método de pago

Vendedor (`registro-visita.js:581-586`): bloquea y marca el error en el campo.
Admin (`visitas.js:547, 553`): `var _mpCobro = gel('rv-metodo-pago') ? … : ''` y luego `metodo_pago: _mpCobro||null`. Se guarda en null sin avisar.

El campo está marcado como obligatorio en la interfaz del admin igual que en la del vendedor.

## A7. Detalles menores

- **Fecha por defecto distinta**: el vendedor pone `hoy()` (`registro-visita.js:518`); el admin pone la fecha de la visita (`visitas.js:502`). El del admin es el correcto — si registras ayer una visita de ayer, el cobro fue ayer.
- **Sin `max` de fecha** tampoco aquí: se puede fechar el cobro en el futuro.
- **Cálculo de días**: el vendedor vuelve a hacerlo a mano (`Math.ceil(...)`, `registro-visita.js:490`); el admin usa `diasHasta()` (`visitas.js:482`). Mismo desfase del hallazgo #10.
- **Plurales**: "Vencido hace 1d" / "Vence en 1d" — aquí se abreviaron a "d", lo que esquiva el problema pero introduce un cuarto formato para la misma información (`Vencido hace 3 días` en la pestaña, `Vencido hace 3d` aquí).
- **Iconos**: "✂️ Parcial" (tijeras) aquí vs "💰 Parcial" en la pestaña Créditos. Y "💰 Cobrar todo" aquí vs "✅ Cobrado" allá — el mismo emoji significa cosas distintas según la pantalla.
- **Nota del saldo**: tres redacciones para el mismo hecho — `'Saldo tras Cobro parcial: 3 de 10 unidades el 06/08/2026'` (Créditos), `'Saldo cobro parcial: pagaron 3 de 10 el 06/08/2026'` (visita vendedor), `'Saldo cobro parcial de Producto X'` sin cifras ni fecha (visita admin).

## A8. Lo que propongo hacer

El reparto de un cobro de crédito está escrito **cuatro veces** y las cuatro difieren:

| Copia | Modo dinero | Conserva el total | Respaldo de precio |
|---|---|---|---|
| `vendedor/creditos.js` | ✓ | ✓ | ✗ |
| `admin/dashboard.js` | ✓ | ✓ | ✓ |
| `vendedor/registro-visita.js` | ✗ | ✗ | ✗ |
| `admin/visitas.js` | ✗ | ✗ | ✓ |

Ninguna las tiene las tres. Añadir el modo dinero copiando el bloque una quinta vez deja el problema peor de lo que está.

**Propuesta:** un `assets/js/cobros.js` compartido —al nivel de `a11y.js` y `session.js`, que ya lo son— que exponga:

- `cpCalcularReparto(venta, modo, valor)` — la versión buena: saldo restado del total, respaldo de precio, marca `aproximado`
- `cpRenderModo(contenedor, opts)` — el par de botones productos/dinero con `aria-pressed`
- `cpRenderPreview(contenedor, reparto)` — el `role="status"` con el desglose
- `cpFilasCobro(venta, reparto, comun)` — devuelve la fila a actualizar y la del saldo, ya cuadradas

Y que los cuatro sitios lo llamen. Con eso, "cobrar en dinero desde Registrar Visita" es conectar el conmutador, y de paso quedan arreglados A1, A5 y la mitad de los hallazgos de la auditoría principal, en los dos paneles a la vez.

Esto sube al **bloque 1** del orden de arreglo: A1 está creando descuadres contables ahora mismo, sin que nadie haga nada raro.

---

**Deuda estructural que causó la mitad de esto:** `cpCalcularReparto`, `cpPreview`, `cpSetModo`, `_cobToggleMPDrop` y `_cobUploadImages` están duplicados literalmente entre `vendedor/assets/js/creditos.js` y `admin/assets/js/dashboard.js`, con un comentario que pide mantenerlos sincronizados a mano. Ya divergieron en el cálculo del precio (#2). Mientras sigan duplicados, cada arreglo hay que hacerlo dos veces y la próxima divergencia es cuestión de tiempo. Extraerlos a `assets/js/cobros.js` (compartido, como ya lo son `a11y.js`, `session.js` y `ui-dialogos.js`) debería ir antes que el bloque 3.
