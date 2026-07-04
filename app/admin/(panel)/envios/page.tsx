"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { ZonaForm } from "@/components/admin/envios/ZonaForm";
import type { EnvioZona } from "@/lib/shipping";

export default function AdminEnviosPage() {
  const [zonas, setZonas] = useState<EnvioZona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<EnvioZona | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("envio_zonas")
      .select("*")
      .order("orden", { ascending: true });
    setZonas((data as EnvioZona[]) ?? []);
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
        <h1 className="font-body text-xl font-bold text-secondary">Zonas de envío</h1>
        <button
          onClick={() => setCreando(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-body text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nueva zona
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <table className="w-full font-body text-sm">
          <thead className="bg-soft-gray text-left text-xs font-bold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Zona</th>
              <th className="px-4 py-3">Departamentos</th>
              <th className="px-4 py-3">Tiempo</th>
              <th className="px-4 py-3">Costo</th>
              <th className="px-4 py-3">Gratis desde</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {!cargando && zonas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Sin zonas configuradas.
                </td>
              </tr>
            )}
            {zonas.map((z) => (
              <tr key={z.id} className="border-t border-border align-top">
                <td className="px-4 py-3 font-bold text-secondary">{z.nombre}</td>
                <td className="max-w-xs px-4 py-3 text-muted-foreground">
                  {z.departamentos.join(", ")}
                </td>
                <td className="px-4 py-3 text-secondary">{z.tiempo_estimado}</td>
                <td className="px-4 py-3 text-secondary">S/.{z.costo_envio.toFixed(2)}</td>
                <td className="px-4 py-3 text-secondary">S/.{z.monto_minimo_gratis.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <Badge color={z.activo ? "verde" : "gris"}>{z.activo ? "Activa" : "Inactiva"}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditando(z)}
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
        <ZonaForm zona={editando} onClose={cerrar} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
