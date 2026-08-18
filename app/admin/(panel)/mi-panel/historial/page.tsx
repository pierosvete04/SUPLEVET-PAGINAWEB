"use client";

import { PedidosPorCupones } from "@/components/admin/editores/PedidosPorCupones";
import { useEditorSesion } from "@/hooks/useEditorSesion";

export default function HistorialEditorPage() {
  const { codigos } = useEditorSesion();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Historial</h2>
        <p className="text-sm text-muted-foreground">Todos tus pedidos, con los mismos filtros que usa el equipo.</p>
      </div>
      <PedidosPorCupones codigos={codigos} />
    </div>
  );
}
