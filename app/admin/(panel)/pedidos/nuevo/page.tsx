"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
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
import { ClienteSelector, type ClientePedidoSeleccionado } from "@/components/admin/pedidos/ClienteSelector";
import { departamentosCheckout } from "@/lib/shipping";
import type { ItemPedido } from "@/lib/data/pedidos-admin";

const FORMA_PAGO_LABEL: Record<string, string> = {
  tarjeta: "Tarjeta",
  yape_plin: "Yape / Plin",
  transferencia: "Transferencia",
  contra_entrega: "Contra entrega",
};

export default function AdminCrearPedidoPage() {
  const router = useRouter();
  const [cliente, setCliente] = useState<ClientePedidoSeleccionado | null>(null);
  const [productos, setProductos] = useState<ItemPedido[]>([]);
  const [buscandoProducto, setBuscandoProducto] = useState(false);
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [departamento, setDepartamento] = useState<string>("");
  const [distrito, setDistrito] = useState("");
  const [direccion, setDireccion] = useState("");
  const [formaPago, setFormaPago] = useState<string>("");
  const [estadoPago, setEstadoPago] = useState<"pendiente_verificacion" | "pagado">("pagado");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = productos.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const total = subtotal + costoEnvio;
  const puedeGuardar = !!cliente && productos.length > 0 && !guardando;

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

  async function guardarPedido() {
    if (!cliente || productos.length === 0) return;
    setGuardando(true);
    setError(null);
    const res = await fetch("/api/admin/pedidos/crear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente_id: cliente.id,
        cliente_nombre: cliente.nombre,
        cliente_apellido: cliente.apellido,
        cliente_email: cliente.email,
        cliente_telefono: cliente.telefono,
        productos,
        costo_envio: costoEnvio,
        departamento: departamento || null,
        distrito: distrito || null,
        direccion: direccion || null,
        forma_pago: formaPago || null,
        estado_pago: estadoPago,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      setError(data?.error ?? "No se pudo crear el pedido.");
      setGuardando(false);
      return;
    }
    router.push(`/admin/pedidos/${data.pedido_id}`);
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
                  Todavía no agregaste productos.
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
                  <Button type="button" variant="ghost" size="sm" onClick={() => quitarProducto(i)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

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
                  onChange={(e) => setCostoEnvio(Number(e.target.value) || 0)}
                  className="w-28 text-right"
                />
              </div>
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
                      {Object.entries(FORMA_PAGO_LABEL).map(([valor, label]) => (
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
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <ClienteSelector value={cliente} onChange={setCliente} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Envío</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Departamento</Label>
                <Select value={departamento} onValueChange={setDepartamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin especificar" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentosCheckout.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Distrito</Label>
                <Input value={distrito} onChange={(e) => setDistrito(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Dirección</Label>
                <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
              </div>
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
