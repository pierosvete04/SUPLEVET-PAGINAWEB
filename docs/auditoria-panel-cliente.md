# Auditoría UX/UI — Panel de cliente (`/mi-cuenta`)

Fecha: 2026-07-29
Alcance: `PÁGINA OFICIAL` únicamente (el proyecto Next.js real). La carpeta
padre `PÁGINA WEB - SUPLEVET` solo contiene material de referencia que
alimenta este proyecto, no código de producción.

## Resumen

El portal tiene su propio sistema de diseño (`app/mi-cuenta/(portal)/portal-theme.css`
+ colores `portal-*` en `tailwind.config.ts`), bien resuelto en Inicio,
SuplePoints, Mascotas, Pedidos, Cursos y Perfil. El problema encontrado no
era falta de pulido puntual, sino que varias pantallas y componentes se
quedaron con el sistema de diseño genérico del sitio (`text-secondary`,
`bg-soft-gray`, `bg-primary`, `rounded-[var(--radius-card)]`) en vez de los
tokens `portal-*`.

## Corregido en esta pasada

- **`confirm()` nativo del navegador** al eliminar una mascota o una
  condición médica → reemplazado por `AlertDialog` (mismo componente que usa
  `/admin`). Archivos: `components/portal/mascotas/MascotaFormDialog.tsx`,
  `components/portal/mascotas/CondicionMedicaFormDialog.tsx`.
- **Diálogos con tokens del sitio genérico** retonados a `portal-*`:
  `components/portal/pedidos/PedidoProductoDialog.tsx`,
  `components/portal/mascotas/SaludEventoFormDialog.tsx`,
  `components/portal/mascotas/CondicionMedicaFormDialog.tsx`.
- **Mensajes de error crudos de Supabase/Postgres** reemplazados por texto en
  español, sin jerga técnica, en los 3 formularios de mascota.
- **Navegación duplicada**: `PortalSidebar.tsx` y `PortalMobileNav.tsx`
  mantenían dos arreglos de items a mano y habían divergido en nombres
  ("SuplePoints" vs "Puntos", "Mis Mascotas" vs "Mascotas"). Ahora ambos
  consumen `lib/portal/nav.ts` como única fuente; `mobileTitle` es la única
  variación permitida y es explícita.
  - De paso, la sección del sidebar que se llamaba **"Comunidad"** (sin
    enlazar nunca a `/mi-cuenta/comunidad`) se renombró a **"Recursos"**,
    que es lo que de verdad contiene (Cursos, Alianzas). Ver sección
    "Pendiente — a propósito" abajo.
- **Regla de color naranja vs. navy** documentada como comentario en
  `portal-theme.css`: naranja = acción que gasta puntos/dinero o hace
  avanzar una compra; navy = navegación/gestión estándar. Se corrigió
  "Comprar ahora" (Inicio), que estaba en navy pese a ser el mismo flujo de
  compra que termina en "Continuar al checkout" (naranja).
- **Radio de bordes topeado a 18px** en todo el panel (pedido explícito).
  Se bajó `.portal-wallet-card`, `.portal-pet-card`, `.portal-achievement-badge`
  y `.portal-card` (antes 20–24px) en `portal-theme.css`, todos los
  `rounded-[24px]`/`rounded-3xl` sueltos en Inicio, Pedidos, Cursos,
  `MascotasGrid` y `MascotaFormDialog`, y los 7 `DialogContent`/`AlertDialogContent`
  del portal (que heredaban `sm:rounded-lg` = 32px del componente shadcn
  compartido a partir de 640px de viewport). Los círculos (`rounded-full`,
  avatares, píldoras) no cuentan como "radio de tarjeta" y se dejaron igual.
- **Página Alianzas** retonada a `portal-*` (era la única pestaña visible en
  el menú que aún usaba el sistema de diseño viejo).
- **Login, Bienvenida y Completar Perfil** retonados a `portal-*`. Nota
  importante: `components/auth/LoginPanel.tsx` (el formulario de código OTP
  en sí) **no se tocó** porque también lo usa `/checkout` — solo se cambió
  el fondo de la página que lo envuelve en `/mi-cuenta/login`.

## Pendiente — a propósito (decisión del cliente)

**Comunidad, Historias y Carnet digital siguen sin enlace en ningún menú.**
Las tres páginas existen y funcionan (`/mi-cuenta/comunidad`,
`/mi-cuenta/historias`, `/mi-cuenta/carnet`), pero el negocio todavía no
tiene una estrategia definida para ellas, así que se mantienen invisibles
deliberadamente. Tampoco se retonó su UI a `portal-*` (siguen con el
sistema de diseño viejo) porque no tiene sentido invertir en pulir pantallas
que nadie ve todavía. Cuando haya estrategia para estas tres, retomar:

1. Decidir estructura de navegación (¿sección propia? ¿dentro de "Recursos"?).
2. Reskin a `portal-*` siguiendo el mismo patrón que Cursos/Perfil.
3. Agregar el enlace en `lib/portal/nav.ts` (sidebar + mobile nav se
   actualizan solos).

**Ranking** sigue desactivado (comentado en `lib/portal/nav.ts`), como ya
estaba antes de esta auditoría. Si se reactiva, también necesita reskin a
`portal-*` primero (usa `text-secondary`, `var(--radius-card)`, etc.).

## Hallazgos menores no corregidos (bajo impacto)

- `PedidoProductoDialog`: el botón "Ver detalle" no muestra información
  adicional a la ya visible en la tarjeta — copy podría ser más específico.
- Mezcla de mayúscula sostenida vs. frase normal en algunas etiquetas
  ("GRATIS", "% COMPLETADO" vs. "Vacuna pendiente", "Al día") en
  `CursosGrid.tsx` / `CursoDetalleView.tsx`.

## Verificación

- `npx tsc --noEmit` sobre todo el proyecto: sin errores tras los cambios.
- No se verificó visualmente en navegador con sesión de cliente real: el
  login del portal usa OTP por correo y no hay credencial de prueba
  disponible en este entorno. Los cambios son sustituciones mecánicas de
  clases Tailwind (colores y radios) sobre un sistema de diseño ya
  documentado en `portal-theme.css`, por lo que el riesgo visual es bajo,
  pero se recomienda una pasada visual manual antes de dar por cerrado.
