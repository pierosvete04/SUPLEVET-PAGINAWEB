"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MaskedTextReveal } from "@/components/shared/MaskedTextReveal";

// Paso único post-registro (solo para clientes nuevos) — replica el paso D
// del portal viejo ("¿Tienes un código de referido?"), ambos ganan 100
// SuplePoints en la primera compra vía la RPC aplicar_codigo_referido.
export default function BienvenidaPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function aplicar(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim()) return omitir();
    setCargando(true);
    setError(null);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("aplicar_codigo_referido", {
      p_codigo: codigo.trim().toUpperCase(),
    });
    if (rpcError || data?.error) {
      const mensajes: Record<string, string> = {
        invalid_format: "Formato inválido. Usa el código de 12 caracteres.",
        own_code: "No puedes usar tu propio código.",
        already_referred: "Ya tienes un código aplicado.",
        code_not_found: "Código no encontrado, verifica que esté bien escrito.",
      };
      setError(mensajes[data?.error] ?? "Error al aplicar el código.");
      setCargando(false);
      return;
    }
    router.push("/mi-cuenta");
    router.refresh();
  }

  function omitir() {
    router.push("/mi-cuenta");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-mobile-margin py-section-y">
      <div className="w-full max-w-sm rounded-[var(--radius-card,1rem)] bg-white p-8 text-center shadow-lg">
        <Gift className="mx-auto h-10 w-10 text-primary" strokeWidth={1.5} />
        <MaskedTextReveal as="h1" className="mt-3 font-display text-lg font-bold text-secondary">
          ¿Tienes un código de referido?
        </MaskedTextReveal>
        <MaskedTextReveal
          as="p"
          type="words"
          delay={0.3}
          className="mt-2 font-body text-xs text-muted-foreground"
        >
          Si alguien te invitó a Suplevet, ambos ganarán 100 SuplePoints cuando hagas tu primera compra.
        </MaskedTextReveal>
        <form onSubmit={aplicar} className="mt-5 flex flex-col gap-3">
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="Ej: SUPLE-A1B2C3"
            className="rounded-lg border border-border px-4 py-3 text-center font-body text-sm font-bold tracking-wide text-secondary"
          />
          {error && <p className="font-body text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={cargando}
            className="rounded-[17px] bg-primary px-6 py-3 font-body font-bold text-primary-foreground disabled:opacity-60"
          >
            {cargando ? "Aplicando…" : "Aplicar código y entrar"}
          </button>
          <button
            type="button"
            onClick={omitir}
            className="font-body text-xs font-bold text-muted-foreground"
          >
            Omitir, no tengo código →
          </button>
        </form>
      </div>
    </div>
  );
}
