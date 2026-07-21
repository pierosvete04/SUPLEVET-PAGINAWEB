import { createClient } from "@/lib/supabase/server";
import { formatFecha } from "@/lib/portal/formato";
import { formatPrecio } from "@/lib/data/productos-shared";
import { NOMBRE_NIVEL } from "@/lib/data/portal/logros";
import { LinkQrCode } from "@/components/shared/LinkQrCode";
import type { ClientePerfil } from "@/lib/data/portal/cliente";

export default async function PortalCarnetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: perfil }, { data: puntos }, { data: comprasVet }] = await Promise.all([
    supabase.from("clientes_perfil").select("*").eq("id", user.id).maybeSingle<ClientePerfil>(),
    supabase
      .from("suplepuntos_clientes")
      .select("nivel, saldo_actual, codigo_referido")
      .eq("cliente_id", user.id)
      .maybeSingle(),
    supabase
      .from("pedidos_vet")
      .select("id, veterinaria_nombre, monto_total, puntos_acreditados, created_at")
      .eq("cliente_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const nombre = [perfil?.nombre, perfil?.apellido].filter(Boolean).join(" ") || user.email?.split("@")[0] || "";
  const nivel = puntos?.nivel ?? "basico";
  const codigoReferido = puntos?.codigo_referido ?? "";
  const linkVet = `https://suplevet.pe/vet/cliente?id=${user.id}&code=${codigoReferido}`;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div className="rounded-[var(--radius-card)] bg-gradient-to-br from-secondary to-secondary/80 p-6 text-center text-white shadow-lg">
        <p className="font-impact text-xs tracking-widest text-sky">CARNET DIGITAL SUPLEVET</p>
        <h1 className="mt-2 font-display text-2xl font-bold">{nombre || "Cliente Suplevet"}</h1>
        <span className="mt-1 inline-block rounded-full bg-white/20 px-3 py-1 font-body text-xs font-bold">
          {NOMBRE_NIVEL[nivel]}
        </span>

        <div className="mx-auto mt-5 w-fit rounded-lg bg-white p-3">
          <LinkQrCode link={linkVet} size={180} />
        </div>

        <p className="mt-4 font-body text-xs text-white/80">
          Muestra este código en tu veterinaria aliada para acreditar SuplePoints en tu compra.
        </p>
      </div>

      <div className="rounded-[var(--radius-card)] bg-white p-5 shadow-sm">
        <h2 className="font-display text-base font-bold text-secondary">¿Cómo funciona?</h2>
        <ol className="mt-3 flex flex-col gap-2 font-body text-sm text-muted-foreground">
          <li>1. Muestra este QR al veterinario en una clínica aliada.</li>
          <li>2. El veterinario lo escanea y ve tu nombre, nivel y puntos.</li>
          <li>3. Ingresa el monto de tu compra — tus SuplePoints se acreditan al instante.</li>
        </ol>
      </div>

      <div className="rounded-[var(--radius-card)] bg-white p-5 shadow-sm">
        <h2 className="font-display text-base font-bold text-secondary">Compras en veterinarias</h2>
        {!comprasVet || comprasVet.length === 0 ? (
          <p className="mt-3 text-center font-body text-xs text-muted-foreground">
            Aún no tienes compras registradas en veterinarias.
          </p>
        ) : (
          <div className="mt-3 flex flex-col divide-y divide-border">
            {comprasVet.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="font-body text-xs font-bold text-secondary">{c.veterinaria_nombre}</p>
                  <p className="font-body text-[10px] text-muted-foreground">{formatFecha(c.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-body text-sm font-bold text-secondary">{formatPrecio(Number(c.monto_total))}</p>
                  {!!c.puntos_acreditados && (
                    <p className="font-body text-[10px] font-bold text-secondary">+{c.puntos_acreditados} pts</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
