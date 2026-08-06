import { BrandedLoader } from "@/components/ui/branded-loader";

// Pantalla de carga del sitio público. Es el archivo que arregla la queja de
// "toco el logo y no pasa nada durante segundos".
//
// Por qué hacía falta: sin un loading.tsx, el App Router no tiene ningún límite
// de Suspense donde cortar, así que al navegar RETIENE la página anterior hasta
// que el servidor termina de renderizar la nueva entera. El usuario hace click,
// no ve absolutamente ningún cambio, y concluye que la web se colgó. Con este
// archivo el cambio de página se ve al instante y el contenido entra después.
//
// Y hay un segundo efecto, menos obvio pero igual de importante: para una ruta
// que no está prerenderizada, el <Link> solo puede prefetchear el loading.tsx.
// Sin él, el prefetch del logo devolvía literalmente 0 KB — es decir, pasar el
// mouse por encima no adelantaba NADA y el click empezaba de cero.
//
// CUBRE LA PANTALLA COMPLETA a propósito. La primera versión no lo hacía, con
// el razonamiento de que el header y el footer viven en el layout y no se
// desmontan al navegar, así que taparlos sería innecesario. En la práctica se
// ve mal: al entrar a un producto quedaba el encabezado y el pie de página
// normales, con un "Cargando" flotando en el hueco del medio, y el conjunto
// parecía una página rota más que una página cargando. Tapar todo con un fondo
// liso lee como una transición y no como un error.
//
// El z-index tiene que quedar por encima de TODO el chrome del sitio o el
// efecto se arruina justo en los bordes: barra condensada del header y botón de
// WhatsApp están en z-50, y el enlace "Saltar al contenido" en z-100. Queda por
// debajo del splash inicial (z-200), que es el único que debe poder taparlo.
//
// Blanco explícito y no `bg-background`: esa variable es 98% de luminosidad
// (un gris muy claro), y contra el blanco de las secciones se notaba el cambio
// de tono al terminar de cargar.
export default function PublicLoading() {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-white">
      <BrandedLoader label="Cargando…" />
    </div>
  );
}
