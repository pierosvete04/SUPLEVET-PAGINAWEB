"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BADGE_NIVEL, formatFecha, nivelLabel, type ClienteResumen } from "@/lib/data/clientes-admin";
import {
  BADGE_ESTADO_PAGO,
  BADGE_ESTADO_PREPARACION,
  formatFechaPedido,
  type PedidoAdmin,
} from "@/lib/data/pedidos-admin";

type PedidoResumen = Pick<
  PedidoAdmin,
  "id" | "shopify_order_number" | "created_at" | "total" | "estado_pago" | "estado_preparacion"
>;

interface Transaccion {
  id: string;
  tipo: string;
  accion: string;
  puntos: number;
  descripcion: string | null;
  created_at: string;
}

interface Mascota {
  id: string;
  nombre: string;
  especie: string;
  raza: string | null;
}

interface Resena {
  id: string;
  producto_nombre: string;
  calificacion: number;
  texto: string;
  estado: string;
}

export default function AdminClienteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [cliente, setCliente] = useState<ClienteResumen | null>(null);
  const [pedidos, setPedidos] = useState<PedidoResumen[]>([]);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("admin_clientes_resumen").select("*").eq("id", id).single(),
      supabase
        .from("pedidos")
        .select("id, shopify_order_number, created_at, total, estado_pago, estado_preparacion")
        .eq("cliente_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("suplepuntos_transacciones")
        .select("id, tipo, accion, puntos, descripcion, created_at")
        .eq("cliente_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("mascotas").select("id, nombre, especie, raza").eq("cliente_id", id),
      supabase
        .from("resenas")
        .select("id, producto_nombre, calificacion, texto, estado")
        .eq("cliente_id", id),
    ]).then(([clienteRes, pedidosRes, txRes, mascotasRes, resenasRes]) => {
      setCliente(clienteRes.data as ClienteResumen);
      setPedidos((pedidosRes.data as PedidoResumen[]) ?? []);
      setTransacciones((txRes.data as Transaccion[]) ?? []);
      setMascotas((mascotasRes.data as Mascota[]) ?? []);
      setResenas((resenasRes.data as Resena[]) ?? []);
      setCargando(false);
    });
  }, [id]);

  if (cargando) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (!cliente) return <p className="text-sm text-muted-foreground">Cliente no encontrado.</p>;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/clientes" className="flex w-fit items-center gap-1 text-sm font-medium text-secondary">
        <ArrowLeft className="h-4 w-4" /> Volver a clientes
      </Link>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {cliente.nombre || cliente.apellido
            ? `${cliente.nombre ?? ""} ${cliente.apellido ?? ""}`.trim()
            : "Sin nombre"}
        </h2>
        <Badge color={BADGE_NIVEL[cliente.nivel ?? "basico"] ?? "gris"}>{nivelLabel(cliente.nivel)}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Pedidos del cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {pedidos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin pedidos todavía.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {pedidos.map((p) => {
                    const pago = BADGE_ESTADO_PAGO[p.estado_pago];
                    const prep = BADGE_ESTADO_PREPARACION[p.estado_preparacion];
                    return (
                      <Link
                        key={p.id}
                        href={`/admin/pedidos/${p.id}`}
                        className="flex flex-col gap-2 rounded-md border p-3 text-sm hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-secondary">
                            {p.shopify_order_number ?? `W-${p.id.slice(0, 8)}`}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatFechaPedido(p.created_at)}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">S/.{Number(p.total).toFixed(2)}</span>
                          <Badge color={pago.color}>{pago.label}</Badge>
                          <Badge color={prep.color}>{prep.label}</Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Transacciones de SuplePoints</CardTitle>
            </CardHeader>
            <CardContent>
              {transacciones.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin transacciones.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {transacciones.map((t) => (
                    <div key={t.id} className="flex justify-between text-sm">
                      <span>{t.descripcion ?? t.accion}</span>
                      <span className={`font-medium ${t.puntos >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {t.puntos >= 0 ? "+" : ""}
                        {t.puntos} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Reseñas</CardTitle>
            </CardHeader>
            <CardContent>
              {resenas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin reseñas dejadas.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {resenas.map((r) => (
                    <div key={r.id} className="border-b pb-3 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{r.producto_nombre}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 fill-secondary text-secondary" /> {r.calificacion}/5
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.texto}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Contacto</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <p className="text-sm">{cliente.email}</p>
              <p className="text-sm text-muted-foreground">{cliente.telefono ?? "Sin teléfono"}</p>
              <p className="text-sm text-muted-foreground">
                {cliente.distrito ?? ""} {cliente.ciudad ?? ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">SuplePoints</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-secondary">{cliente.saldo_actual ?? 0} pts</p>
              <p className="text-sm text-muted-foreground">{cliente.total_compras ?? 0} compras totales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Mascotas registradas</CardTitle>
            </CardHeader>
            <CardContent>
              {mascotas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin mascotas registradas.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {mascotas.map((m) => (
                    <p key={m.id} className="text-sm">
                      {m.nombre} — {m.especie}
                      {m.raza ? ` (${m.raza})` : ""}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
