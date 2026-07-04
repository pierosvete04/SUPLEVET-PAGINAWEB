"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
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

  if (cargando) return <p className="font-body text-sm text-muted-foreground">Cargando…</p>;
  if (!pedido) return <p className="font-body text-sm text-muted-foreground">Pedido no encontrado.</p>;

  const dir = pedido.direccion_envio;
  const pago = BADGE_ESTADO_PAGO[pedido.estado_pago];

  return (
    <div>
      <Link
        href="/admin/pedidos"
        className="mb-6 flex w-fit items-center gap-1 font-body text-sm font-bold text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a pedidos
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-body text-xl font-bold text-secondary">
          Pedido {pedido.shopify_order_number ?? `W-${pedido.id.slice(0, 8)}`}
        </h1>
        <Badge color={pago.color}>{pago.label}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-white p-5">
            <h2 className="mb-3 font-body text-sm font-bold uppercase text-muted-foreground">
              Artículos
            </h2>
            <div className="flex flex-col gap-2">
              {pedido.productos.map((item, i) => (
                <div key={i} className="flex justify-between font-body text-sm text-secondary">
                  <span>
                    {item.cantidad}x {item.nombre}
                  </span>
                  <span className="font-bold">S/.{(item.precio * item.cantidad).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t border-border pt-3 font-body font-bold text-secondary">
              <span>Total</span>
              <span className="text-primary">S/.{Number(pedido.total).toFixed(2)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white p-5">
            <h2 className="mb-3 font-body text-sm font-bold uppercase text-muted-foreground">
              Dirección de envío
            </h2>
            {dir ? (
              <p className="font-body text-sm text-secondary">
                {dir.direccion}, {dir.distrito}, {dir.provincia}, {dir.departamento}
              </p>
            ) : (
              <p className="font-body text-sm text-muted-foreground">
                Sin dirección registrada{pedido.zona_envio ? ` — zona: ${pedido.zona_envio}` : ""}.
              </p>
            )}
          </div>

          {pedido.captura_pago_url && (
            <div className="rounded-xl border border-border bg-white p-5">
              <h2 className="mb-3 font-body text-sm font-bold uppercase text-muted-foreground">
                Captura de pago ({pedido.forma_pago})
              </h2>
              <div className="relative h-96 w-full overflow-hidden rounded-lg bg-soft-gray">
                <Image
                  src={pedido.captura_pago_url}
                  alt="Captura de pago"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-white p-5">
            <h2 className="mb-3 font-body text-sm font-bold uppercase text-muted-foreground">
              Verificación de pago
            </h2>
            <div className="flex gap-2">
              <button
                disabled={actualizando}
                onClick={() => actualizarCampo("estado_pago", "pagado")}
                className="flex-1 rounded-lg bg-green-600 px-3 py-2 font-body text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                Confirmar
              </button>
              <button
                disabled={actualizando}
                onClick={() => actualizarCampo("estado_pago", "rechazado")}
                className="flex-1 rounded-lg bg-red-600 px-3 py-2 font-body text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white p-5">
            <h2 className="mb-3 font-body text-sm font-bold uppercase text-muted-foreground">
              Estado de preparación
            </h2>
            <select
              value={pedido.estado_preparacion}
              disabled={actualizando}
              onChange={(e) => actualizarCampo("estado_preparacion", e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 font-body text-sm text-secondary"
            >
              {Object.entries(BADGE_ESTADO_PREPARACION).map(([valor, { label }]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-border bg-white p-5">
            <h2 className="mb-3 font-body text-sm font-bold uppercase text-muted-foreground">
              Cliente
            </h2>
            <p className="font-body text-sm text-secondary">{pedido.cliente_nombre ?? "Sin nombre"}</p>
            <p className="font-body text-sm text-muted-foreground">{pedido.cliente_email}</p>
            <p className="mb-3 font-body text-sm text-muted-foreground">
              {pedido.cliente_telefono ?? "Sin teléfono"}
            </p>
            <p className="mb-3 font-body text-xs text-muted-foreground">
              {formatFechaPedido(pedido.created_at)}
            </p>
            {pedido.cliente_telefono && (
              <a
                href={whatsappLink(
                  pedido.cliente_telefono,
                  `Hola, te escribimos por tu pedido ${pedido.shopify_order_number ?? ""}`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 font-body text-sm font-bold text-white hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4" /> Abrir conversación de WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
