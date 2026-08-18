"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Cupon } from "@/components/admin/cupones/CuponForm";
import { PedidosPorCupones } from "@/components/admin/editores/PedidosPorCupones";
import { ClientesAsignados } from "@/components/admin/editores/ClientesAsignados";
import { MisCampanas } from "@/components/admin/editores/MisCampanas";

const LABEL_TIPO: Record<Cupon["tipo"], string> = {
  envio_gratis: "Envío gratis",
  pct_envio: "% envío",
  pct_producto: "% producto",
  monto_fijo_producto: "Monto fijo producto",
};

export default function MiPanelEditorPage() {
  const [miId, setMiId] = useState<string | null>(null);
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setCargando(false);
        return;
      }
      setMiId(user.id);
      const { data } = await supabase
        .from("cupones")
        .select("*")
        .eq("editor_id", user.id)
        .order("created_at", { ascending: false });
      setCupones((data as Cupon[]) ?? []);
      setCargando(false);
    }
    cargar();
  }, []);

  const codigos = cupones.map((c) => c.codigo);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Mi dashboard</h2>
          <p className="text-sm text-muted-foreground">Ventas hechas con tus cupones.</p>
        </div>
        <Button asChild>
          <Link href="/admin/mi-panel/nuevo">
            <Plus className="h-4 w-4" /> Crear pedido
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <h3 className="text-sm font-semibold">Tus cupones</h3>
          {!cargando && cupones.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no tienes ningún cupón asignado — pídele uno al equipo de Suplevet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {cupones.map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
                  <span className="font-mono font-medium">{c.codigo}</span>
                  <span className="text-muted-foreground">
                    {LABEL_TIPO[c.tipo]}
                    {c.tipo !== "envio_gratis" && ` · ${c.tipo.startsWith("pct") ? `${c.valor}%` : `S/.${c.valor}`}`}
                  </span>
                  <Badge color={c.activo ? "verde" : "gris"}>{c.activo ? "Activo" : "Inactivo"}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PedidosPorCupones codigos={codigos} />

      {miId && <MisCampanas editorId={miId} codigosCupon={codigos} />}

      {miId && <ClientesAsignados editorId={miId} codigosCupon={codigos} puedeAsignar={false} />}
    </div>
  );
}
