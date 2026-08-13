"use client";

import { useEffect, useRef, useState, use as usePromise } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Gift, MessageCircle, Package, Printer, Upload } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { traducirErrorSupabase } from "@/lib/errores-supabase";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { uploadFileToR2 } from "@/lib/uploadToR2";

// Yape/Plin y transferencia no tienen procesador que confirme el pago solo
// (a diferencia de tarjeta vía Mercado Pago) — el comprobante que sube el
// admin es la única evidencia real del cobro, así que se exige antes de
// habilitar "Confirmar". La API además lo vuelve a validar server-side.
const FORMAS_QUE_EXIGEN_COMPROBANTE = ["yape_plin", "transferencia"];

const FORMA_PAGO_LABEL: Record<string, string> = {
  tarjeta: "Tarjeta (Mercado Pago)",
  yape_plin: "Yape / Plin",
  transferencia: "Transferencia bancaria",
  contra_entrega: "Pago contra entrega",
  shopify: "Checkout de Shopify",
};

// Las únicas formas que el equipo cobra a mano, y por eso las únicas que se
// pueden elegir acá — el caso real es el cliente que pidió contra entrega y
// termina pagando por transferencia. Tarjeta y Shopify quedan fuera: ese pago
// lo verifica el procesador solo, no el panel. La API repite estas reglas.
const FORMAS_PAGO_EDITABLES = ["yape_plin", "transferencia", "contra_entrega"];
const FORMAS_PAGO_NO_EDITABLES: Record<string, string> = {
  tarjeta: "El pago con tarjeta lo verifica Mercado Pago automáticamente.",
  shopify: "Pedido importado de Shopify: su método de pago es un dato histórico.",
};

// El folder de la ruta se llama [numero] a propósito: la URL debe mostrar el
// número de pedido (ej. "W-1074"), no el UUID interno — mucho más legible al
// compartirla o pegarla en el navegador. Sigue aceptando un UUID crudo por
// compatibilidad con links viejos ya enviados (correos, Telegram, "Crear
// pedido" redirige con el id recién creado), pero todas las llamadas que
// mutan datos usan pedido.id (el UUID real) una vez cargado, nunca el
// parámetro de la URL.
const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function AdminPedidoDetallePage({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = usePromise(params);
  const identificador = decodeURIComponent(numero);
  const [pedido, setPedido] = useState<PedidoAdmin | null>(null);
  const [bandanasRegalo, setBandanasRegalo] = useState<RegaloVariante[]>([]);
  const [imagenesPorSlug, setImagenesPorSlug] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);
  const [confirmarEstadoPago, setConfirmarEstadoPago] = useState<"pagado" | "rechazado" | "cancelado" | null>(
    null
  );
  const [notificarEstadoPago, setNotificarEstadoPago] = useState(true);
  const [confirmarEstadoPreparacion, setConfirmarEstadoPreparacion] = useState<string | null>(null);
  const [notificarEstadoPreparacion, setNotificarEstadoPreparacion] = useState(true);
  const inputComprobanteRef = useRef<HTMLInputElement>(null);

  async function cargar() {
    setCargando(true);
    const supabase = createClient();
    const { data } = ES_UUID.test(identificador)
      ? await supabase.from("pedidos").select("*").eq("id", identificador).single()
      : await supabase.from("pedidos").select("*").eq("numero_pedido", identificador).single();
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
  }, [identificador]);

  const LABEL_CAMPO: Record<string, string> = {
    courier: "Empresa de envío",
    courier_otro: "Nombre del courier",
    captura_pago_url: "el comprobante de pago",
  };

  async function actualizarCampo(campo: string, valor: string) {
    if (!pedido) return;
    setActualizando(true);
    const { error: saveError } = await createClient().from("pedidos").update({ [campo]: valor }).eq("id", pedido.id);
    await cargar();
    setActualizando(false);
    if (saveError) {
      toast.error(traducirErrorSupabase(saveError));
      return;
    }
    toast.success(`Se actualizó "${LABEL_CAMPO[campo] ?? "el pedido"}".`);
  }

  async function subirComprobante(file: File) {
    if (!pedido) return;
    setSubiendoComprobante(true);
    const url = await uploadFileToR2("pedidos-comprobantes", file, pedido.id);
    setSubiendoComprobante(false);
    if (!url) {
      toast.error("No se pudo subir el comprobante. Intenta de nuevo.");
      return;
    }
    await actualizarCampo("captura_pago_url", url);
  }

  // A diferencia de actualizarCampo(), este pasa por una ruta API en vez de
  // actualizar la tabla directo desde el navegador, porque acá además hay que
  // mandar el correo de pago_confirmado/pago_error — y RESEND_API_KEY no
  // puede vivir en el cliente. La ruta reutiliza la misma RLS ("Solo admin
  // actualiza pedidos") así que la autorización no cambia.
  async function actualizarEstadoPago(estado: "pagado" | "rechazado" | "cancelado", notificar: boolean) {
    if (!pedido) return;
    setActualizando(true);
    const res = await fetch(`/api/admin/pedidos/${pedido.id}/estado-pago`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado, notificar }),
    });
    const data = await res.json().catch(() => null);
    await cargar();
    setActualizando(false);
    if (!res.ok) {
      toast.error(data?.error ?? "No se pudo actualizar el estado del pago.");
      return;
    }
    toast.success(
      estado === "pagado" ? "Pago confirmado." : estado === "rechazado" ? "Pago rechazado." : "Pedido cancelado."
    );
  }

  // También pasa por la API: las reglas de qué método se puede cambiar (y el
  // volver a "pendiente de verificación" cuando el pedido ya estaba pagado y
  // pasa a una forma que exige comprobante) no las puede garantizar la RLS,
  // que solo distingue admin de no admin.
  async function actualizarFormaPago(forma: string) {
    if (!pedido) return;
    setActualizando(true);
    const res = await fetch(`/api/admin/pedidos/${pedido.id}/forma-pago`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forma_pago: forma }),
    });
    const data = await res.json().catch(() => null);
    await cargar();
    setActualizando(false);
    if (!res.ok) {
      toast.error(data?.error ?? "No se pudo cambiar el método de pago.");
      return;
    }
    if (data?.vuelveAPendiente) {
      toast.warning(
        `Método de pago cambiado a ${FORMA_PAGO_LABEL[forma]}. El pedido volvió a "pendiente de verificación": sube el comprobante y confírmalo de nuevo.`
      );
      return;
    }
    if (data?.requiereComprobante) {
      toast.success(
        `Método de pago cambiado a ${FORMA_PAGO_LABEL[forma]}. Ahora necesitas subir el comprobante para confirmar el pago.`
      );
      return;
    }
    toast.success(`Método de pago cambiado a ${FORMA_PAGO_LABEL[forma]}.`);
  }

  // Igual que actualizarEstadoPago(): al marcar "entregado" la ruta además
  // acredita SuplePoints (a la entrega, no al pago — evita fraude por
  // devolución inmediata) y manda el correo correspondiente.
  async function actualizarEstadoPreparacion(estado: string, notificar: boolean) {
    if (!pedido) return;
    setActualizando(true);
    const res = await fetch(`/api/admin/pedidos/${pedido.id}/estado-preparacion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado, notificar }),
    });
    const data = await res.json().catch(() => null);
    await cargar();
    setActualizando(false);
    if (!res.ok) {
      toast.error(data?.error ?? "No se pudo actualizar el estado de preparación.");
      return;
    }
    toast.success("Estado de preparación actualizado.");
  }

  if (cargando) return <BrandedLoader />;
  if (!pedido) return <p className="text-sm text-muted-foreground">Pedido no encontrado.</p>;

  const dir = pedido.direccion_envio as DireccionEnvioPedidoAdmin | null;
  const pago = BADGE_ESTADO_PAGO[pedido.estado_pago];
  const requiereComprobante = FORMAS_QUE_EXIGEN_COMPROBANTE.includes(pedido.forma_pago ?? "");
  const formaPagoBloqueada = FORMAS_PAGO_NO_EDITABLES[pedido.forma_pago ?? ""];
  const comprobantePendiente = requiereComprobante && !pedido.captura_pago_url;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/pedidos" className="flex w-fit items-center gap-1 text-sm font-medium text-secondary">
        <ArrowLeft className="h-4 w-4" /> Volver a pedidos
      </Link>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Pedido {pedido.numero_pedido ?? `W-${pedido.id.slice(0, 8)}`}
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

          {(pedido.captura_pago_url || requiereComprobante) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Captura de pago ({FORMA_PAGO_LABEL[pedido.forma_pago ?? ""] ?? pedido.forma_pago})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {pedido.captura_pago_url ? (
                  <div className="relative h-96 w-full overflow-hidden rounded-lg bg-soft-gray">
                    <Image
                      src={pedido.captura_pago_url}
                      alt="Captura de pago"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-amber-600">
                    Este pedido usa {FORMA_PAGO_LABEL[pedido.forma_pago ?? ""]?.toLowerCase()}: sube el comprobante
                    antes de poder confirmar el pago.
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  disabled={subiendoComprobante || actualizando}
                  onClick={() => inputComprobanteRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {subiendoComprobante
                    ? "Subiendo…"
                    : pedido.captura_pago_url
                      ? "Reemplazar comprobante"
                      : "Subir comprobante"}
                </Button>
                <input
                  ref={inputComprobanteRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) subirComprobante(file);
                    e.target.value = "";
                  }}
                />
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
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground" htmlFor="forma-pago">
                  Método de pago
                </label>
                {formaPagoBloqueada ? (
                  <>
                    <p className="text-sm font-medium">
                      {FORMA_PAGO_LABEL[pedido.forma_pago ?? ""] ?? "No especificado"}
                    </p>
                    <p className="text-xs text-muted-foreground">{formaPagoBloqueada}</p>
                  </>
                ) : (
                  <>
                    <Select
                      value={
                        FORMAS_PAGO_EDITABLES.includes(pedido.forma_pago ?? "")
                          ? (pedido.forma_pago as string)
                          : undefined
                      }
                      disabled={actualizando || pedido.estado_pago === "cancelado"}
                      onValueChange={actualizarFormaPago}
                    >
                      <SelectTrigger id="forma-pago">
                        <SelectValue placeholder="No especificado" />
                      </SelectTrigger>
                      <SelectContent>
                        {FORMAS_PAGO_EDITABLES.map((valor) => (
                          <SelectItem key={valor} value={valor}>
                            {FORMA_PAGO_LABEL[valor]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Cámbialo si el cliente terminó pagando de otra forma. Yape y transferencia
                      piden comprobante para poder confirmar el pago.
                    </p>
                  </>
                )}
              </div>
              {pedido.estado_pago === "cancelado" ? (
                <p className="text-sm text-muted-foreground">Este pedido fue cancelado. No hay nada más que verificar.</p>
              ) : pedido.estado_pago === "pagado" ? (
                <p className="text-sm text-muted-foreground">Este pago ya fue confirmado. No hay nada más que verificar.</p>
              ) : (
                <>
                  {comprobantePendiente && (
                    <p className="text-xs text-amber-600">
                      Sube el comprobante de pago en la tarjeta &quot;Captura de pago&quot; para poder confirmar.
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      disabled={actualizando || comprobantePendiente}
                      onClick={() => setConfirmarEstadoPago("pagado")}
                      className="flex-1 bg-green-600 hover:bg-green-600/90"
                    >
                      Confirmar
                    </Button>
                    <Button
                      disabled={actualizando}
                      onClick={() => setConfirmarEstadoPago("rechazado")}
                      variant="destructive"
                      className="flex-1"
                    >
                      Rechazar
                    </Button>
                  </div>
                  <Button
                    disabled={actualizando}
                    onClick={() => setConfirmarEstadoPago("cancelado")}
                    variant="outline"
                    className="w-full"
                  >
                    Cancelar pedido
                  </Button>
                </>
              )}
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
                onValueChange={(valor) =>
                  // "no_preparado" no manda correo (ver comentario en la API),
                  // así que no hace falta preguntar si avisar al cliente.
                  valor === "no_preparado"
                    ? actualizarEstadoPreparacion(valor, false)
                    : setConfirmarEstadoPreparacion(valor)
                }
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

      <AlertDialog
        open={!!confirmarEstadoPago}
        onOpenChange={(open) => {
          if (!open) setConfirmarEstadoPago(null);
          setNotificarEstadoPago(true);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmarEstadoPago === "pagado"
                ? "¿Confirmar el pago de este pedido?"
                : confirmarEstadoPago === "cancelado"
                  ? "¿Cancelar este pedido?"
                  : "¿Rechazar el pago de este pedido?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmarEstadoPago === "pagado"
                ? "El pedido pasará a pagado."
                : confirmarEstadoPago === "cancelado"
                  ? "El pedido se marcará como cancelado."
                  : "El pago se marcará como rechazado."}{" "}
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex items-center gap-2 rounded-md border bg-soft-gray px-3 py-2 text-sm">
            <Checkbox
              checked={notificarEstadoPago}
              onCheckedChange={(checked) => setNotificarEstadoPago(checked === true)}
            />
            <span>
              Avisar al cliente por correo{" "}
              {confirmarEstadoPago === "pagado"
                ? "que su pago fue confirmado"
                : confirmarEstadoPago === "cancelado"
                  ? "que su pedido fue cancelado"
                  : "que su pago fue rechazado"}
            </span>
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmarEstadoPago) actualizarEstadoPago(confirmarEstadoPago, notificarEstadoPago);
                setConfirmarEstadoPago(null);
              }}
            >
              {confirmarEstadoPago === "pagado"
                ? "Confirmar pago"
                : confirmarEstadoPago === "cancelado"
                  ? "Cancelar pedido"
                  : "Rechazar pago"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!confirmarEstadoPreparacion}
        onOpenChange={(open) => {
          if (!open) setConfirmarEstadoPreparacion(null);
          setNotificarEstadoPreparacion(true);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar el estado de preparación?</AlertDialogTitle>
            <AlertDialogDescription>
              El pedido pasará a &quot;
              {confirmarEstadoPreparacion ? BADGE_ESTADO_PREPARACION[confirmarEstadoPreparacion]?.label : ""}
              &quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex items-center gap-2 rounded-md border bg-soft-gray px-3 py-2 text-sm">
            <Checkbox
              checked={notificarEstadoPreparacion}
              onCheckedChange={(checked) => setNotificarEstadoPreparacion(checked === true)}
            />
            <span>Avisar al cliente por correo de este cambio</span>
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmarEstadoPreparacion)
                  actualizarEstadoPreparacion(confirmarEstadoPreparacion, notificarEstadoPreparacion);
                setConfirmarEstadoPreparacion(null);
              }}
            >
              Guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
