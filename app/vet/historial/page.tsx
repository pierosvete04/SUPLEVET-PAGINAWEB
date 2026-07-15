"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { clearVetSesion, getVetSesion, type VetSesion } from "@/lib/vet-auth";
import { formatFecha } from "@/lib/portal/formato";

interface VentaVet {
  id: string;
  cliente_email: string | null;
  monto_total: number;
  puntos_acreditados: number | null;
  numero_pedido: string | null;
  created_at: string;
}

export default function VetHistorialPage() {
  const router = useRouter();
  const [sesion, setSesion] = useState<VetSesion | null>(null);
  const [ventas, setVentas] = useState<VentaVet[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const s = getVetSesion();
    if (!s) {
      router.push("/vet");
      return;
    }
    setSesion(s);
    createClient()
      .from("pedidos_vet")
      .select("id, cliente_email, monto_total, puntos_acreditados, numero_pedido, created_at")
      .eq("veterinaria_id", s.veterinariaId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setVentas((data as VentaVet[]) ?? []);
        setCargando(false);
      });
  }, [router]);

  function cerrarSesion() {
    clearVetSesion();
    router.push("/vet");
  }

  if (!sesion) return null;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="font-body text-xs text-muted-foreground">Historial de ventas</p>
          <h1 className="font-display text-xl font-bold text-secondary">{sesion.veterinariaNombre}</h1>
        </div>
        <button
          type="button"
          onClick={cerrarSesion}
          className="flex items-center gap-1.5 font-body text-xs font-bold text-muted-foreground"
        >
          <LogOut className="h-3.5 w-3.5" /> Salir
        </button>
      </div>

      {cargando ? (
        <p className="font-body text-sm text-muted-foreground">Cargando…</p>
      ) : ventas.length === 0 ? (
        <p className="rounded-[var(--radius-card,1rem)] bg-white p-8 text-center font-body text-sm text-muted-foreground shadow-sm">
          Aún no registras ventas.
        </p>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-card,1rem)] bg-white shadow-sm">
          {ventas.map((v) => (
            <div key={v.id} className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0">
              <div>
                <p className="font-body text-sm font-bold text-secondary">{v.cliente_email ?? "Cliente"}</p>
                <p className="font-body text-[10px] text-muted-foreground">
                  {formatFecha(v.created_at)} {v.numero_pedido ? `· ${v.numero_pedido}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-body text-sm font-bold text-secondary">S/ {Number(v.monto_total).toFixed(2)}</p>
                {!!v.puntos_acreditados && (
                  <p className="font-body text-[10px] font-bold text-primary">+{v.puntos_acreditados} pts</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
