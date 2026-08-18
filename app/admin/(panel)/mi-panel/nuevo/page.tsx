"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface CuponPropio {
  id: string;
  codigo: string;
  tipo: "envio_gratis" | "pct_envio" | "pct_producto" | "monto_fijo_producto";
  valor: number;
}

// El equivalente de /admin/pedidos/nuevo para un editor: mismos pasos de
// entrega (ShippingStep) y regalos, pero factura siempre con uno de sus
// propios cupones y pasa por el RPC registrar_pedido_web en vez de un
// INSERT directo — ver /api/mi-panel/pedidos/crear.
export default function CrearPedidoEditorPage() {
  const router = useRouter();
  const [cupones, setCupones] = useState<CuponPropio[]>([]);
  const [codigoCupon, setCodigoCupon] = useState("");
  const [cliente, setCliente] = useState<ClientePedidoSeleccionado | null>(null);
  const [productos, setProductos] = useState<ItemPedido[]>([]);
  const [buscandoProducto, setBuscandoProducto] = useState(false);
  const [direccion, setDireccion] = useState<DireccionEnvio>(direccionVacia);
  const [zona, setZona] = useState<EnvioZona | undefined>(undefined);
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [costoTarifa, setCostoTarifa] = useState<number | null>(null);
  const [envioEditadoAMano, setEnvioEditadoAMano] = useState(false);
  const [bandanas, setBandanas] = useState<(BandanaSeleccion | null)[]>([]);
  const [slotsBandanaRequeridos, setSlotsBandanaRequeridos] = useState(0);
  const [formaPago, setFormaPago] = useState<string>("yape_plin");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarCupones() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("cupones")
        .select("id, codigo, tipo, valor")
        .eq("editor_id", user.id)
        .eq("activo", true)
        .order("created_at", { ascending: false });
      const propios = (data as CuponPropio[]) ?? [];
      setCupones(propios);
      if (propios.length === 1) setCodigoCupon(propios[0].codigo);
    }
    cargarCupones();
  }, []);

  const subtotal = productos.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const total = subtotal + costoEnvio;
  const combosQty = productos
    .filter((i) => i.categoria === "combo")
    .reduce((acc, i) => acc + i.cantidad, 0);
  const puedeGuardar =
    !!cliente && !!direccion.nombre.trim() && productos.length > 0 && !!codigoCupon && !guardando;

  useEffect(() => {
    if (!envioEditadoAMano && costoTarifa !== null) setCostoEnvio(costoTarifa);
  }, [envioEditadoAMano, costoTarifa]);

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
    if (!cliente || productos.length === 0 || !codigoCupon) return;
    setGuardando(true);
    setError(null);
    const res = await fetch("/api/mi-panel/pedidos/crear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo_cupon: codigoCupon,
        cliente_id: cliente.id,
        cliente_email: cliente.email,
        cliente_nombre: direccion.nombre,
        cliente_apellido: direccion.apellidos,
        cliente_telefono: direccion.telefono || null,
        productos,
        costo_envio: costoEnvio,
        zona_envio: zona ? zonaEnvioSlug(zona.nombre) : null,
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
        forma_pago: formaPago,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      setError(data?.error ?? "No se pudo crear el pedido.");
      setGuardando(false);
      return;
    }
    toast.success("Pedido creado. Queda pendiente de verificación de pago.");
    router.push("/admin/mi-panel");
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/mi-panel" className="flex w-fit items-center gap-1 text-sm font-medium text-secondary">
        <ArrowLeft className="h-4 w-4" /> Volver a mi dashboard
      </Link>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Crear pedido</h2>
        <Button onClick={guardarPedido} disabled={!puedeGuardar}>
          {guardando ? "Guardando…" : "Crear pedido"}
        </Button>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {cupones.length === 0 ? (
        <p className="rounded-md bg-orange-50 px-3 py-2 text-sm text-orange-700">
          Todavía no tienes ningún cupón activo asignado — pídele uno al equipo de Suplevet antes de registrar una
          venta.
        </p>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-1.5 pt-6">
            <Label>Cupón con el que se factura esta venta</Label>
            <Select value={codigoCupon} onValueChange={setCodigoCupon}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Elige un cupón" />
              </SelectTrigger>
              <SelectContent>
                {cupones.map((c) => (
                  <SelectItem key={c.id} value={c.codigo}>
                    {c.codigo}
                    {c.tipo !== "envio_gratis" && ` (${c.tipo.startsWith("pct") ? `${c.valor}%` : `S/.${c.valor}`})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
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
                <p className="py-6 text-center text-sm text-muted-foreground">Sin productos todavía.</p>
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
                <span>Total (antes del descuento del cupón)</span>
                <span className="text-secondary">S/.{total.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                El descuento del cupón se calcula al guardar y el pedido queda pendiente de verificación de pago —
                el equipo de Suplevet lo confirma después.
              </p>

              <div className="grid gap-1.5">
                <Label>Forma de pago</Label>
                <Select value={formaPago} onValueChange={setFormaPago}>
                  <SelectTrigger className="w-52">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["tarjeta", "yape_plin", "transferencia"] as const).map((valor) => (
                      <SelectItem key={valor} value={valor}>
                        {METODO_PAGO_LABEL[valor]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <ClienteSelector value={cliente} onChange={setCliente} onPerfilCargado={precargarDesdePerfil} />
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
