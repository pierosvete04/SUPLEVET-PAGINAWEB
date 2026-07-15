"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { setVetSesion } from "@/lib/vet-auth";

export default function VetLoginPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim()) return;
    setCargando(true);
    setError(null);

    const supabase = createClient();
    const { data, error: queryError } = await supabase
      .from("veterinarias")
      .select("id, nombre, activa")
      .eq("codigo_acceso", codigo.trim())
      .maybeSingle();

    setCargando(false);
    if (queryError || !data || !data.activa) {
      setError("Código de acceso inválido");
      return;
    }

    setVetSesion({ codigoAcceso: codigo.trim(), veterinariaId: data.id, veterinariaNombre: data.nombre });
    router.push("/vet/historial");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-mobile-margin">
      <div className="w-full max-w-sm rounded-[var(--radius-card,1rem)] bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Image src="/logos/logo-color-horizontal.png" alt="Suplevet" width={150} height={32} priority />
          <h1 className="font-display text-lg font-bold text-secondary">Portal Veterinario</h1>
          <p className="font-body text-sm text-muted-foreground">
            Ingresa el código de acceso de tu clínica
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            required
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="VET-XXXX-000"
            className="rounded-lg border border-border px-4 py-3 text-center font-body text-sm font-bold tracking-wide text-secondary"
          />
          {error && <p className="text-center font-body text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={cargando}
            className="rounded-full bg-primary px-6 py-3 font-body font-bold text-primary-foreground disabled:opacity-60"
          >
            {cargando ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
