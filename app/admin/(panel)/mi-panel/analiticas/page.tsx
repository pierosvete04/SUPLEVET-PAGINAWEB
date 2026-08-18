"use client";

import { MisCampanas } from "@/components/admin/editores/MisCampanas";
import { useEditorSesion } from "@/hooks/useEditorSesion";

export default function AnaliticasEditorPage() {
  const { miId, codigos, cargando } = useEditorSesion();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Analíticas</h2>
        <p className="text-sm text-muted-foreground">
          Todas las métricas de tus campañas asignadas — elige qué columnas ver con &quot;Columnas&quot;.
        </p>
      </div>
      {!cargando && miId && <MisCampanas editorId={miId} codigosCupon={codigos} />}
    </div>
  );
}
