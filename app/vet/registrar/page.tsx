"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getVetSesion } from "@/lib/vet-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface RegistrarResultado {
  ok: boolean;
  error?: string;
  puntos?: number;
  veterinaria?: string;
  cliente_email?: string;
}

export default function VetRegistrarPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [monto, setMonto] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<RegistrarResultado | null>(null);

  useEffect(() => {
    if (!getVetSesion()) router.push("/vet");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sesion = getVetSesion();
    const clienteId = params.get("id");
    if (!sesion || !clienteId) return;
    const montoNum = parseFloat(monto);
    if (!montoNum || montoNum <= 0) {
      setError("Ingresa un monto válido");
      return;
    }
    setEnviando(true);
    setError(null);
    const { data, error: rpcError } = await createClient().rpc("registrar_pedido_vet", {
      p_codigo_acceso: sesion.codigoAcceso,
      p_cliente_id: clienteId,
      p_monto_total: montoNum,
      p_productos: [],
      p_numero_pedido: numeroPedido.trim() || null,
      p_notas: notas.trim() || null,
    });
    setEnviando(false);
    if (rpcError || !data?.ok) {
      setError(data?.error ?? "No se pudo registrar la venta");
      return;
    }
    setResultado(data as RegistrarResultado);
  }

  if (resultado?.ok) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 p-6 text-center">
        <CheckCircle2 className="h-14 w-14 text-green-500" strokeWidth={1.5} />
        <h1 className="font-display text-xl font-bold text-secondary">Venta registrada</h1>
        <p className="font-body text-sm text-muted-foreground">
          +{resultado.puntos} SuplePoints acreditados a {resultado.cliente_email}
        </p>
        <Button onClick={() => router.push("/vet/historial")}>Ver historial</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 font-display text-xl font-bold text-secondary">Registrar compra</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label>Monto total (S/)</Label>
          <Input type="number" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>N° de pedido (opcional)</Label>
          <Input value={numeroPedido} onChange={(e) => setNumeroPedido(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>Notas (opcional)</Label>
          <Textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
        </div>
        {error && <p className="font-body text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={enviando}>
          {enviando ? "Registrando…" : "Registrar venta"}
        </Button>
      </form>
    </div>
  );
}
