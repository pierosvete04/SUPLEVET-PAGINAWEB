"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { CuponForm, type Cupon } from "@/components/admin/cupones/CuponForm";

const LABEL_TIPO: Record<Cupon["tipo"], string> = {
  envio_gratis: "Envío gratis",
  pct_envio: "% envío",
  pct_producto: "% producto",
  monto_fijo_producto: "Monto fijo producto",
};

export default function AdminCuponesPage() {
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<Cupon | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("cupones")
      .select("*")
      .order("created_at", { ascending: false });
    setCupones((data as Cupon[]) ?? []);
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
        <h1 className="font-body text-xl font-bold text-secondary">Cupones</h1>
        <button
          onClick={() => setCreando(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-body text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nuevo cupón
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <table className="w-full font-body text-sm">
          <thead className="bg-soft-gray text-left text-xs font-bold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Condiciones</th>
              <th className="px-4 py-3">Usos</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {!cargando && cupones.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Sin cupones todavía.
                </td>
              </tr>
            )}
            {cupones.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3 font-bold text-secondary">{c.codigo}</td>
                <td className="px-4 py-3 text-secondary">{LABEL_TIPO[c.tipo]}</td>
                <td className="px-4 py-3 text-secondary">
                  {c.tipo === "envio_gratis"
                    ? "—"
                    : c.tipo.startsWith("pct")
                      ? `${c.valor}%`
                      : `S/.${c.valor.toFixed(2)}`}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.monto_minimo > 0 ? `Compra ≥ S/.${c.monto_minimo.toFixed(2)}` : "Sin mínimo"}
                </td>
                <td className="px-4 py-3 text-secondary">
                  {c.usos_actuales} / {c.usos_maximos ?? "∞"}
                </td>
                <td className="px-4 py-3">
                  <Badge color={c.activo ? "verde" : "gris"}>{c.activo ? "Activo" : "Inactivo"}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditando(c)}
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
        <CuponForm cupon={editando} onClose={cerrar} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
