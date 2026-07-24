"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Gift, MessageCircle, Package, Printer } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { whatsappLink } from "@/lib/site-config";
import { mensajeWhatsappPedido } from "@/lib/whatsapp-pedido";
import { BrandedLoader } from "@/components/ui/branded-loader";
import {
  BADGE_ESTADO_PAGO,
  BADGE_ESTADO_PREPARACION,
  formatFechaPedido,
  type ItemPedido,
  type PedidoAdmin,
} from "@/lib/data/pedidos-admin";
import { getVariantesPorSlugs, type RegaloVariante } from "@/lib/regalo-variantes";
import { COURIER_POR_DEFECTO, COURIERS } from "@/lib/couriers";
import {
  DireccionEnvioCard,
  type DireccionEnvioPedidoAdmin,
} from "@/components/admin/pedidos/DireccionEnvioCard";

export default function AdminPedidoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [pedido, setPedido] = useState<PedidoAdmin | null>(null);
  const [bandanasRegalo, setBandanasRegalo] = useState<RegaloVariante[]>([]);
  const [imagenesPorSlug, setImagenesPorSlug] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  async function cargar() {
    setCargando(true);
    const supabase = createClient();
    const { data } = await supabase.from("pedidos").select("*").eq("id", id).single();
    setPedido(data as PedidoAdmin);
    const p = data as PedidoAdmin | null;
    const slugsBandanas = p?.regalo_bandanas?.length
      ? p.regalo_bandanas.map((b) => b.slug)
      : p?.regalo_bandana
        ? [p.regalo_bandana]
        : [];
    setBandanasRegalo(await getVariantesPorSlugs(supabase, slugsBandanas));
    await cargarImagenes(supabase, (data as PedidoAdmin | null)?.productos ?? []);
    setCargando(false);
  }

  // Los items del pedido guardan solo nombre/precio/cantidad — la imagen vive
  // en productos_web. Los pedidos de la web traen el slug en `sku`; los
  // sincronizados desde Shopify traen `sku` vacío pero sí `producto_id`, así
  // que se busca por ambos y se indexa por la clave que tenga cada item. Un
  // producto que ya no está en el catálogo cae al placeholder.
  async function cargarImagenes(supabase: ReturnType<typeof createClient>, items: ItemPedido[]) {
    const slugs = items.map((i) => i.sku).filter((s): s is string => !!s);
    const shopifyIds = items.map((i) => i.producto_id).filter((s): s is string => !!s);
    if (slugs.length === 0 && shopifyIds.length === 0) {
      setImagenesPorSlug({});
      return;
    }

    const { data } = await supabase
      .from("productos_web")
      .select("slug, imagen, shopify_product_id")
      .or(
        [
          slugs.length ? `slug.in.(${slugs.join(",")})` : null,
          shopifyIds.length ? `shopify_product_id.in.(${shopifyIds.join(",")})` : null,
        ]
          .filter(Boolean)
          .join(",")
      );

    const mapa: Record<string, string> = {};
    for (const p of data ?? []) {
      if (!p.imagen) continue;
      mapa[p.slug] = p.imagen;
      if (p.shopify_product_id) mapa[p.shopify_product_id] = p.imagen;
    }
    setImagenesPorSlug(mapa);
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

  // A diferencia de actualizarCampo(), este pasa por una ruta API en vez de
  // actualizar la tabla directo desde el navegador, porque acá además hay que
  // mandar el correo de pago_confirmado/pago_error — y RESEND_API_KEY no
  // puede vivir en el cliente. La ruta reutiliza la misma RLS ("Solo admin
  // actualiza pedidos") así que la autorización no cambia.
  async function actualizarEstadoPago(estado: "pagado" | "rechazado" | "cancelado") {
    setActualizando(true);
    await fetch(`/api/admin/pedidos/${id}/estado-pago`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    await cargar();
    setActualizando(false);
  }

  // Igual que actualizarEstadoPago(): al marcar "entregado" la ruta además
  // acredita SuplePoints (a la entrega, no al pago — evita fraude por
  // devolución inmediata) y manda el correo correspondiente.
  async function actualizarEstadoPreparacion(estado: string) {
    setActualizando(true);
    await fetch(`/api/admin/pedidos/${id}/estado-preparacion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    await cargar();
    setActualizando(false);
  }

  if (cargando) return <BrandedLoader />;
  if (!pedido) return <p className="text-sm text-muted-foreground">Pedido no encontrado.</p>;

  const dir = pedido.direccion_envio as DireccionEnvioPedidoAdmin | null;
  const pago = BADGE_ESTADO_PAGO[pedido.estado_pago];

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/pedidos" className="flex w-fit items-center gap-1 text-sm font-medium text-secondary">
        <ArrowLeft className="h-4 w-4" /> Volver a pedidos
      </Link>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Pedido {pedido.shopify_order_number ?? `W-${pedido.id.slice(0, 8)}`}
        </h2>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/rotulo/${pedido.id}`} target="_blank">
              <Printer className="h-4 w-4" /> Rótulo
            </Link>
          </Button>
          <Badge color={pago.color}>{pago.label}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Artículos</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {pedido.productos.map((item, i) => {
                const imagen =
                  (item.sku ? imagenesPorSlug[item.sku] : undefined) ??
                  (item.producto_id ? imagenesPorSlug[item.producto_id] : undefined);
                return (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-soft-gray">
                      {imagen ? (
                        <Image
                          src={imagen}
                          alt={item.nombre}
                          fill
                          className="object-contain p-1"
                          sizes="56px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    <span className="min-w-0 flex-1">
                      {item.cantidad}x {item.nombre}
                    </span>
                    <span className="shrink-0 font-medium">
                      S/.{(item.precio * item.cantidad).toFixed(2)}
                    </span>
                  </div>
                );
              })}
              <div className="mt-2 flex justify-between border-t pt-3 font-semibold">
                <span>Total</span>
                <span className="text-secondary">S/.{Number(pedido.total).toFixed(2)}</span>
              </div>
              {bandanasRegalo.map((bandana, i) => (
                <div key={`${bandana.slug}-${i}`} className="mt-2 flex items-center gap-3 rounded-md bg-soft-gray p-2.5">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-white">
                    {bandana.imagen && (
                      <Image
                        src={bandana.imagen}
                        alt={`Bandana ${bandana.nombre}`}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    )}
                  </div>
                  <p className="flex items-center gap-1.5 text-sm">
                    <Gift className="h-4 w-4 shrink-0 text-secondary" strokeWidth={1.75} />
                    Regalo: <strong>Bandana {bandana.nombre} — Talla {bandana.talla}</strong>
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <DireccionEnvioCard
            pedidoId={pedido.id}
            direccion={dir}
            zonaEnvio={pedido.zona_envio}
            onGuardado={cargar}
          />

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
            <CardContent className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  disabled={actualizando}
                  onClick={() => actualizarEstadoPago("pagado")}
                  className="flex-1 bg-green-600 hover:bg-green-600/90"
                >
                  Confirmar
                </Button>
                <Button
                  disabled={actualizando}
                  onClick={() => actualizarEstadoPago("rechazado")}
                  variant="destructive"
                  className="flex-1"
                >
                  Rechazar
                </Button>
              </div>
              <Button
                disabled={actualizando}
                onClick={() => actualizarEstadoPago("cancelado")}
                variant="outline"
                className="w-full"
              >
                Cancelar pedido
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
                onValueChange={actualizarEstadoPreparacion}
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
              <CardTitle className="text-sm text-muted-foreground">Empresa de envío</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Select
                value={pedido.courier ?? COURIER_POR_DEFECTO}
                disabled={actualizando}
                onValueChange={(valor) => actualizarCampo("courier", valor)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COURIERS.map(({ id, label }) => (
                    <SelectItem key={id} value={id}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {pedido.courier === "otro" && (
                <Input
                  defaultValue={pedido.courier_otro ?? ""}
                  disabled={actualizando}
                  placeholder="Nombre del courier"
                  onBlur={(e) => {
                    const valor = e.target.value.trim();
                    if (valor !== (pedido.courier_otro ?? "")) actualizarCampo("courier_otro", valor);
                  }}
                />
              )}

              <p className="text-xs text-muted-foreground">Sale impresa en el rótulo.</p>
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
                    href={whatsappLink(pedido.cliente_telefono, mensajeWhatsappPedido(pedido))}
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
