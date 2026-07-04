"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { whatsappLink } from "@/lib/site-config";
import {
  BADGE_ESTADO_PAGO,
  BADGE_ESTADO_PREPARACION,
  formatFechaPedido,
  type PedidoAdmin,
} from "@/lib/data/pedidos-admin";

export default function AdminPedidoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [pedido, setPedido] = useState<PedidoAdmin | null>(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  async function cargar() {
    setCargando(true);
    const { data } = await createClient().from("pedidos").select("*").eq("id", id).single();
    setPedido(data as PedidoAdmin);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function actualizarCampo(campo: string, valor: string) {
    setActualizando(true);
    await createClient().from("pedidos").update({ [campo]: valor }).eq("id", id);
    await cargar();
    setActualizando(false);
  }

  if (cargando) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (!pedido) return <p className="text-sm text-muted-foreground">Pedido no encontrado.</p>;

  const dir = pedido.direccion_envio;
  const pago = BADGE_ESTADO_PAGO[pedido.estado_pago];

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/pedidos" className="flex w-fit items-center gap-1 text-sm font-medium text-primary">
        <ArrowLeft className="h-4 w-4" /> Volver a pedidos
      </Link>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Pedido {pedido.shopify_order_number ?? `W-${pedido.id.slice(0, 8)}`}
        </h2>
        <Badge color={pago.color}>{pago.label}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Artículos</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {pedido.productos.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>
                    {item.cantidad}x {item.nombre}
                  </span>
                  <span className="font-medium">S/.{(item.precio * item.cantidad).toFixed(2)}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t pt-3 font-semibold">
                <span>Total</span>
                <span className="text-primary">S/.{Number(pedido.total).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Dirección de envío</CardTitle>
            </CardHeader>
            <CardContent>
              {dir ? (
                <p className="text-sm">
                  {dir.direccion}, {dir.distrito}, {dir.provincia}, {dir.departamento}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sin dirección registrada{pedido.zona_envio ? ` — zona: ${pedido.zona_envio}` : ""}.
                </p>
              )}
            </CardContent>
          </Card>

          {pedido.captura_pago_url && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Captura de pago ({pedido.forma_pago})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-96 w-full overflow-hidden rounded-lg bg-soft-gray">
                  <Image
                    src={pedido.captura_pago_url}
                    alt="Captura de pago"
                    fill
                    className="object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Verificación de pago</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                disabled={actualizando}
                onClick={() => actualizarCampo("estado_pago", "pagado")}
                className="flex-1 bg-green-600 hover:bg-green-600/90"
              >
                Confirmar
              </Button>
              <Button
                disabled={actualizando}
                onClick={() => actualizarCampo("estado_pago", "rechazado")}
                variant="destructive"
                className="flex-1"
              >
                Rechazar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Estado de preparación</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={pedido.estado_preparacion}
                disabled={actualizando}
                onValueChange={(valor) => actualizarCampo("estado_preparacion", valor)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BADGE_ESTADO_PREPARACION).map(([valor, { label }]) => (
                    <SelectItem key={valor} value={valor}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <p className="text-sm font-medium">{pedido.cliente_nombre ?? "Sin nombre"}</p>
              <p className="text-sm text-muted-foreground">{pedido.cliente_email}</p>
              <p className="text-sm text-muted-foreground">{pedido.cliente_telefono ?? "Sin teléfono"}</p>
              <p className="mb-2 text-xs text-muted-foreground">{formatFechaPedido(pedido.created_at)}</p>
              {pedido.cliente_telefono && (
                <Button asChild className="bg-green-600 hover:bg-green-600/90">
                  <a
                    href={whatsappLink(
                      pedido.cliente_telefono,
                      `Hola, te escribimos por tu pedido ${pedido.shopify_order_number ?? ""}`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" /> Abrir conversación de WhatsApp
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
