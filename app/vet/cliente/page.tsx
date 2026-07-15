"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PawPrint, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getVetSesion } from "@/lib/vet-auth";
import { NOMBRE_NIVEL } from "@/lib/data/portal/logros";
import { Button } from "@/components/ui/button";

interface ClienteQr {
  ok: boolean;
  error?: string;
  cliente?: {
    id: string;
    nombre: string;
    nivel: string;
    puntos: number;
    mascotas: { nombre: string; especie: string }[];
  };
}

export default function VetClientePage() {
  const router = useRouter();
  const params = useSearchParams();
  const [resultado, setResultado] = useState<ClienteQr | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const sesion = getVetSesion();
    if (!sesion) {
      router.push("/vet");
      return;
    }
    const clienteId = params.get("id");
    if (!clienteId) {
      setResultado({ ok: false, error: "QR inválido: falta el identificador del cliente" });
      setCargando(false);
      return;
    }
    createClient()
      .rpc("buscar_cliente_por_qr", { p_codigo_acceso: sesion.codigoAcceso, p_cliente_id: clienteId })
      .then(({ data }) => {
        setResultado(data as ClienteQr);
        setCargando(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  if (cargando) {
    return <p className="p-6 text-center font-body text-sm text-muted-foreground">Buscando cliente…</p>;
  }

  if (!resultado?.ok || !resultado.cliente) {
    return (
      <div className="mx-auto max-w-sm p-6 text-center">
        <p className="font-body text-sm text-destructive">{resultado?.error ?? "Cliente no encontrado"}</p>
        <Button className="mt-4" onClick={() => router.push("/vet")}>
          Volver
        </Button>
      </div>
    );
  }

  const c = resultado.cliente;
  const clienteId = params.get("id")!;
  const code = params.get("code") ?? "";

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 p-6">
      <div className="rounded-[var(--radius-card,1rem)] bg-white p-6 text-center shadow-sm">
        <h1 className="font-display text-xl font-bold text-secondary">{c.nombre}</h1>
        <span className="mt-2 inline-block rounded-full bg-accent/20 px-3 py-1 font-body text-xs font-bold text-secondary">
          {NOMBRE_NIVEL[c.nivel] ?? c.nivel}
        </span>
        <div className="mt-3 flex items-center justify-center gap-1.5 font-body text-sm font-bold text-primary">
          <Star className="h-4 w-4" strokeWidth={1.75} />
          {c.puntos.toLocaleString()} SuplePoints
        </div>

        {c.mascotas.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {c.mascotas.map((m, i) => (
              <span
                key={i}
                className="flex items-center gap-1 rounded-full bg-soft-gray px-3 py-1 font-body text-xs text-secondary"
              >
                <PawPrint className="h-3 w-3" /> {m.nombre}
              </span>
            ))}
          </div>
        )}
      </div>

      <Button onClick={() => router.push(`/vet/registrar?id=${clienteId}&code=${code}`)}>
        Registrar compra
      </Button>
    </div>
  );
}
