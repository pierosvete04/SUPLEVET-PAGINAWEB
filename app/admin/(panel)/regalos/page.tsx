"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Gift } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { RegaloForm, type Regalo } from "@/components/admin/regalos/RegaloForm";

export default function AdminRegalosPage() {
  const [regalos, setRegalos] = useState<Regalo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<Regalo | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("regalos")
      .select("*")
      .order("created_at", { ascending: false });
    setRegalos((data as Regalo[]) ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function cerrar() {
    setEditando(null);
    setCreando(false);
  }

  async function recargarYCerrar() {
    await cargar();
    cerrar();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-body text-xl font-bold text-secondary">Regalos</h1>
        <button
          onClick={() => setCreando(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-body text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nuevo regalo
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <table className="w-full font-body text-sm">
          <thead className="bg-soft-gray text-left text-xs font-bold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Regalo</th>
              <th className="px-4 py-3">Condición</th>
              <th className="px-4 py-3">Vigencia</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {!cargando && regalos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Sin regalos configurados.
                </td>
              </tr>
            )}
            {regalos.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="flex items-center gap-3 px-4 py-3">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-soft-gray">
                    {r.imagen ? (
                      <Image src={r.imagen} alt="" fill className="object-cover" sizes="40px" />
                    ) : (
                      <Gift className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <span className="font-bold text-secondary">{r.nombre}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {r.condicion_tipo === "monto_minimo"
                    ? `Compra ≥ S/.${(r.condicion_monto_minimo ?? 0).toFixed(2)}`
                    : `Producto: ${r.condicion_producto_slug ?? "—"}`}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {r.fecha_inicio || r.fecha_fin
                    ? `${r.fecha_inicio ?? "…"} → ${r.fecha_fin ?? "…"}`
                    : "Sin fecha límite"}
                </td>
                <td className="px-4 py-3">
                  <Badge color={r.activo ? "verde" : "gris"}>{r.activo ? "Activo" : "Inactivo"}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditando(r)}
                    className="font-body text-sm font-bold text-primary hover:underline"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(creando || editando) && (
        <RegaloForm regalo={editando} onClose={cerrar} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
