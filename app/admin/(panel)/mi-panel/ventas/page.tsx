"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Cupon } from "@/components/admin/cupones/CuponForm";
import { useEditorSesion } from "@/hooks/useEditorSesion";

const LABEL_TIPO: Record<Cupon["tipo"], string> = {
  envio_gratis: "Envío gratis",
  pct_envio: "% envío",
  pct_producto: "% producto",
  monto_fijo_producto: "Monto fijo producto",
};

function CopiarCodigo({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    await navigator.clipboard.writeText(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }
  return (
    <Button variant="outline" size="sm" onClick={copiar}>
      {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copiado ? "Copiado" : "Copiar"}
    </Button>
  );
}

// "Solo muestra el código de descuento del editor" — lo que necesita para
// pasárselo a un cliente por WhatsApp/DM, sin ruido de tablas ni filtros.
export default function VentasEditorPage() {
  const { cupones, cargando } = useEditorSesion();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Ventas</h2>
        <p className="text-sm text-muted-foreground">
          Tu(s) código(s) de cupón — es lo que le das al cliente para que la compra quede registrada como tuya.
        </p>
      </div>

      {!cargando && cupones.length === 0 && (
        <p className="rounded-md bg-orange-50 px-3 py-2 text-sm text-orange-700">
          Todavía no tienes ningún cupón asignado — pídele uno al equipo de Suplevet.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cupones.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xl font-bold tracking-wide">{c.codigo}</span>
                <Badge color={c.activo ? "verde" : "gris"}>{c.activo ? "Activo" : "Inactivo"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {LABEL_TIPO[c.tipo]}
                {c.tipo !== "envio_gratis" && ` · ${c.tipo.startsWith("pct") ? `${c.valor}%` : `S/.${c.valor}`}`}
              </p>
              <CopiarCodigo codigo={c.codigo} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
