"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { BADGE_NIVEL, formatFecha, type ClienteResumen } from "@/lib/data/clientes-admin";

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
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("admin_clientes_resumen").select("*").eq("id", id).single(),
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
    ]).then(([clienteRes, txRes, mascotasRes, resenasRes]) => {
      setCliente(clienteRes.data as ClienteResumen);
      setTransacciones((txRes.data as Transaccion[]) ?? []);
      setMascotas((mascotasRes.data as Mascota[]) ?? []);
      setResenas((resenasRes.data as Resena[]) ?? []);
      setCargando(false);
    });
  }, [id]);

  if (cargando) return <p className="font-body text-sm text-muted-foreground">Cargando…</p>;
  if (!cliente) return <p className="font-body text-sm text-muted-foreground">Cliente no encontrado.</p>;

  return (
    <div>
      <Link
        href="/admin/clientes"
        className="mb-6 flex w-fit items-center gap-1 font-body text-sm font-bold text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a clientes
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-body text-xl font-bold text-secondary">
          {cliente.nombre || cliente.apellido
            ? `${cliente.nombre ?? ""} ${cliente.apellido ?? ""}`.trim()
            : "Sin nombre"}
        </h1>
        <Badge color={BADGE_NIVEL[cliente.nivel ?? "basico"] ?? "gris"}>{cliente.nivel ?? "básico"}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-white p-5">
            <h2 className="mb-3 font-body text-sm font-bold uppercase text-muted-foreground">
              Transacciones de SuplePoints
            </h2>
            {transacciones.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground">Sin transacciones.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {transacciones.map((t) => (
                  <div key={t.id} className="flex justify-between font-body text-sm text-secondary">
                    <span>{t.descripcion ?? t.accion}</span>
                    <span className={`font-bold ${t.puntos >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {t.puntos >= 0 ? "+" : ""}
                      {t.puntos} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-white p-5">
            <h2 className="mb-3 font-body text-sm font-bold uppercase text-muted-foreground">Reseñas</h2>
            {resenas.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground">Sin reseñas dejadas.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {resenas.map((r) => (
                  <div key={r.id} className="border-b border-border pb-3 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm font-bold text-secondary">
                        {r.producto_nombre}
                      </span>
                      <span className="flex items-center gap-1 font-body text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-primary text-primary" /> {r.calificacion}/5
                      </span>
                    </div>
                    <p className="font-body text-sm text-muted-foreground">{r.texto}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-white p-5">
            <h2 className="mb-3 font-body text-sm font-bold uppercase text-muted-foreground">Contacto</h2>
            <p className="font-body text-sm text-secondary">{cliente.email}</p>
            <p className="font-body text-sm text-muted-foreground">{cliente.telefono ?? "Sin teléfono"}</p>
            <p className="font-body text-sm text-muted-foreground">
              {cliente.distrito ?? ""} {cliente.ciudad ?? ""}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-white p-5">
            <h2 className="mb-3 font-body text-sm font-bold uppercase text-muted-foreground">
              SuplePoints
            </h2>
            <p className="font-body text-2xl font-bold text-primary">{cliente.saldo_actual ?? 0} pts</p>
            <p className="font-body text-sm text-muted-foreground">
              {cliente.total_compras ?? 0} compras totales
            </p>
          </div>

          <div className="rounded-xl border border-border bg-white p-5">
            <h2 className="mb-3 font-body text-sm font-bold uppercase text-muted-foreground">
              Mascotas registradas
            </h2>
            {mascotas.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground">Sin mascotas registradas.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {mascotas.map((m) => (
                  <p key={m.id} className="font-body text-sm text-secondary">
                    {m.nombre} — {m.especie}
                    {m.raza ? ` (${m.raza})` : ""}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
