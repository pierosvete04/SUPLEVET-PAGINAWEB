"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BuscarProductoModal } from "@/components/admin/pedidos/BuscarProductoModal";
import {
  ClienteSelector,
  type ClientePedidoSeleccionado,
  type PerfilCliente,
} from "@/components/admin/pedidos/ClienteSelector";
import { ShippingStep, direccionVacia, type DireccionEnvio } from "@/components/checkout/ShippingStep";
import { SelectorRegaloBandanas } from "@/components/regalos/SelectorRegaloBandanas";
import type { BandanaSeleccion } from "@/lib/cart/CartContext";
import { zonaEnvioSlug, type EnvioZona } from "@/lib/shipping";
import { METODO_PAGO_LABEL } from "@/lib/data/productos-shared";
import type { ItemPedido } from "@/lib/data/pedidos-admin";
import type { TipoDocumento } from "@/lib/documento";
import { uploadFileToR2 } from "@/lib/uploadToR2";

// Yape/Plin y transferencia no tienen procesador que confirme el pago solo
// (a diferencia de tarjeta vía Mercado Pago): si se marca "pagado" con uno de
// estos métodos, el comprobante es la única evidencia real del cobro.
const FORMAS_QUE_EXIGEN_COMPROBANTE = ["yape_plin", "transferencia"];

export default function AdminCrearPedidoPage() {
  const router = useRouter();
  const [cliente, setCliente] = useState<ClientePedidoSeleccionado | null>(null);
  const [productos, setProductos] = useState<ItemPedido[]>([]);
  const [buscandoProducto, setBuscandoProducto] = useState(false);
  const [direccion, setDireccion] = useState<DireccionEnvio>(direccionVacia);
  const [zona, setZona] = useState<EnvioZona | undefined>(undefined);
  const [costoEnvio, setCostoEnvio] = useState(0);
  /** Tarifa que corresponde según zona/distrito/método (null = aún sin datos). */
  const [costoTarifa, setCostoTarifa] = useState<number | null>(null);
  // El costo sale de la tarifa configurada (envio_zonas / envio_distritos),
  // igual que en el checkout, pero una venta cargada a mano a veces se cierra
  // con otro precio de envío. Apenas se toca el campo deja de recalcularse
  // solo, para no pisar lo que el equipo acordó con el cliente.
  const [envioEditadoAMano, setEnvioEditadoAMano] = useState(false);
  const [bandanas, setBandanas] = useState<(BandanaSeleccion | null)[]>([]);
  const [slotsBandanaRequeridos, setSlotsBandanaRequeridos] = useState(0);
  const [formaPago, setFormaPago] = useState<string>("");
  const [estadoPago, setEstadoPago] = useState<"pendiente_verificacion" | "pagado">("pagado");
  const [capturaPagoUrl, setCapturaPagoUrl] = useState<string | null>(null);
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputComprobanteRef = useRef<HTMLInputElement>(null);

  const subtotal = productos.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const total = subtotal + costoEnvio;
  const combosQty = productos
    .filter((i) => i.categoria === "combo")
    .reduce((acc, i) => acc + i.cantidad, 0);
  const requiereComprobante =
    estadoPago === "pagado" && FORMAS_QUE_EXIGEN_COMPROBANTE.includes(formaPago);
  const puedeGuardar =
    !!cliente &&
    !!direccion.nombre.trim() &&
    productos.length > 0 &&
    !guardando &&
    !subiendoComprobante &&
    (!requiereComprobante || !!capturaPagoUrl);

  useEffect(() => {
    if (!envioEditadoAMano && costoTarifa !== null) setCostoEnvio(costoTarifa);
  }, [envioEditadoAMano, costoTarifa]);

  // Si se quitan combos del pedido, las bandanas que sobran se descartan: el
  // servidor las rechazaría igual y quedarían mostrándose como elegidas.
  useEffect(() => {
    setBandanas((prev) => (prev.length > slotsBandanaRequeridos ? prev.slice(0, slotsBandanaRequeridos) : prev));
  }, [slotsBandanaRequeridos]);

  function precargarDesdePerfil(perfil: PerfilCliente) {
    setDireccion((d) => ({
      ...d,
      nombre: perfil.nombre || d.nombre,
      apellidos: perfil.apellido || d.apellidos,
      telefono: perfil.telefono || d.telefono,
      direccion: perfil.direccion || d.direccion,
      departamento: perfil.ciudad || d.departamento,
      provincia: perfil.provincia || d.provincia,
      distrito: perfil.distrito || d.distrito,
      codigoPostal: perfil.codigo_postal || d.codigoPostal,
      lat: perfil.lat ?? d.lat,
      lng: perfil.lng ?? d.lng,
      tipoDocumento: (perfil.tipo_documento as TipoDocumento) || d.tipoDocumento,
      numeroDocumento: perfil.numero_documento || d.numeroDocumento,
    }));
  }

  async function subirComprobante(file: File) {
    setSubiendoComprobante(true);
    const url = await uploadFileToR2("pedidos-comprobantes", file);
    setSubiendoComprobante(false);
    if (!url) {
      toast.error("No se pudo subir el comprobante. Intenta de nuevo.");
      return;
    }
    setCapturaPagoUrl(url);
  }

  function agregarProducto(item: ItemPedido) {
    setProductos((prev) => [...prev, item]);
  }

  function cambiarCantidad(index: number, cantidad: number) {
    if (cantidad < 1) return;
    setProductos((prev) => prev.map((p, i) => (i === index ? { ...p, cantidad } : p)));
  }

  function quitarProducto(index: number) {
    setProductos((prev) => prev.filter((_, i) => i !== index));
  }

  function cambiarBandana(indice: number, seleccion: BandanaSeleccion | null) {
    setBandanas((prev) => {
      const copia = [...prev];
      while (copia.length <= indice) copia.push(null);
      copia[indice] = seleccion;
      return copia;
    });
  }

  async function guardarPedido() {
    if (!cliente || productos.length === 0) return;
    setGuardando(true);
    setError(null);
    const res = await fetch("/api/admin/pedidos/crear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente_id: cliente.id,
        cliente_email: cliente.email,
        cliente_nombre: direccion.nombre,
        cliente_apellido: direccion.apellidos,
        cliente_telefono: direccion.telefono || null,
        productos,
        costo_envio: costoEnvio,
        zona_envio: zona ? zonaEnvioSlug(zona.nombre) : null,
        // Mismo jsonb que arma el checkout (registrar_pedido_web) — de él
        // salen el rótulo, el link de Maps para el courier y el correo.
        direccion_envio: {
          direccion: direccion.direccion,
          direccionSecundaria: direccion.direccionSecundaria,
          distrito: direccion.distrito,
          provincia: direccion.provincia,
          departamento: direccion.departamento,
          codigoPostal: direccion.codigoPostal,
          metodoEnvio: direccion.metodoEnvio,
          tipoDocumento: direccion.numeroDocumento ? direccion.tipoDocumento : null,
          numeroDocumento: direccion.numeroDocumento || null,
          lat: direccion.lat,
          lng: direccion.lng,
        },
        regalo_bandanas: bandanas.filter((b): b is BandanaSeleccion => b !== null),
        forma_pago: formaPago || null,
        estado_pago: estadoPago,
        captura_pago_url: capturaPagoUrl,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      setError(data?.error ?? "No se pudo crear el pedido.");
      setGuardando(false);
      return;
    }
    toast.success("Pedido creado.");
    router.push(`/admin/pedidos/${data.numero_pedido ?? data.pedido_id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/pedidos" className="flex w-fit items-center gap-1 text-sm font-medium text-secondary">
        <ArrowLeft className="h-4 w-4" /> Volver a pedidos
      </Link>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Crear pedido</h2>
        <Button onClick={guardarPedido} disabled={!puedeGuardar}>
          {guardando ? "Guardando…" : "Crear pedido"}
        </Button>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Productos</CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={() => setBuscandoProducto(true)}>
                <Plus className="h-4 w-4" /> Agregar producto
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {productos.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Sin productos todavía.
                </p>
              )}
              {productos.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3 border-b py-2 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.nombre}</p>
                    <p className="text-xs text-muted-foreground">S/.{item.precio.toFixed(2)} c/u</p>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    value={item.cantidad}
                    onChange={(e) => cambiarCantidad(i, Number(e.target.value))}
                    className="w-16 text-center"
                  />
                  <span className="w-20 text-right text-sm font-medium">
                    S/.{(item.precio * item.cantidad).toFixed(2)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Quitar producto"
                    onClick={() => quitarProducto(i)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* El mismo formulario que ve el cliente en el checkout: DNI con
              consulta a RENIEC, dirección con Google + mapa arrastrable
              (coordenadas para el courier), ubigeo y método de envío. */}
          <Card>
            <CardContent className="pt-6">
              <ShippingStep
                contexto="admin"
                subtotal={subtotal}
                value={direccion}
                onChange={setDireccion}
                onZonaChange={(z, costo) => {
                  setZona(z);
                  setCostoTarifa(costo);
                }}
              />
            </CardContent>
          </Card>

          {/* Los regalos se rigen por las mismas condiciones que la web (un
              combo = una bandana), así que el pedido cargado a mano sale con
              la bandana ya asignada y descontada de stock. */}
          <SelectorRegaloBandanas
            variant="checkout"
            contexto="admin"
            subtotal={subtotal}
            combosQty={combosQty}
            selecciones={bandanas}
            onCambiarSlot={cambiarBandana}
            onSlotsRequeridos={setSlotsBandanaRequeridos}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Pago</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>S/.{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Costo de envío</span>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={costoEnvio}
                  onChange={(e) => {
                    setEnvioEditadoAMano(true);
                    setCostoEnvio(Number(e.target.value) || 0);
                  }}
                  className="w-28 text-right"
                />
              </div>
              {envioEditadoAMano && (
                <button
                  type="button"
                  className="w-fit text-xs font-medium text-secondary underline"
                  onClick={() => setEnvioEditadoAMano(false)}
                >
                  Volver a la tarifa configurada
                </button>
              )}
              <div className="flex justify-between border-t pt-3 font-semibold">
                <span>Total</span>
                <span className="text-secondary">S/.{total.toFixed(2)}</span>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Forma de pago</Label>
                  <Select value={formaPago} onValueChange={setFormaPago}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin especificar" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(METODO_PAGO_LABEL).map(([valor, label]) => (
                        <SelectItem key={valor} value={valor}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Estado del pago</Label>
                  <Select value={estadoPago} onValueChange={(v) => setEstadoPago(v as typeof estadoPago)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pagado">Pagado</SelectItem>
                      <SelectItem value="pendiente_verificacion">Pendiente de verificación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {requiereComprobante && (
                <div className="flex flex-col gap-1.5">
                  <Label>Comprobante de pago</Label>
                  {capturaPagoUrl ? (
                    <div className="flex items-center gap-3 rounded-md border p-2">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-soft-gray">
                        <Image src={capturaPagoUrl} alt="Comprobante de pago" fill className="object-contain" sizes="64px" />
                      </div>
                      <p className="flex-1 text-xs text-muted-foreground">Comprobante subido.</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label="Quitar comprobante"
                        onClick={() => setCapturaPagoUrl(null)}
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={subiendoComprobante}
                        onClick={() => inputComprobanteRef.current?.click()}
                      >
                        <Upload className="h-4 w-4" />
                        {subiendoComprobante ? "Subiendo…" : "Subir comprobante"}
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
                      <p className="text-xs text-muted-foreground">
                        Yape/Plin y transferencia necesitan el comprobante antes de marcar el pedido como pagado.
                      </p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <ClienteSelector
                value={cliente}
                onChange={setCliente}
                onPerfilCargado={precargarDesdePerfil}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {buscandoProducto && (
        <BuscarProductoModal onAgregar={agregarProducto} onClose={() => setBuscandoProducto(false)} />
      )}
    </div>
  );
}
