import { BrandedLoader } from "@/components/ui/branded-loader";

// Pantalla de carga del panel. Cubre TODA la ventana, sidebar y cabecera
// incluidos, a propósito: antes usaba el `fullScreen` de BrandedLoader (z-50) y
// según el momento se veía o la pantalla limpia o el panel de fondo con el
// indicador flotando encima, que se leía como una página rota en vez de una
// página cargando.
//
// El z-index tiene que ganarle a todo el chrome del panel: el sidebar de
// escritorio está en z-10, su tirador de redimensionado en z-20 y los diálogos
// de shadcn en z-50. Con z-[120] queda por encima de los tres.
//
// Blanco explícito y no `bg-background` (98% de luminosidad): el área de
// contenido del panel usa bg-soft-gray, y con un tono casi-blanco encima el
// borde entre ambos se notaba.
export default function AdminPanelLoading() {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-white">
      <BrandedLoader label="Cargando panel…" />
    </div>
  );
}
