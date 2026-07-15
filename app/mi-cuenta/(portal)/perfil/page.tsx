import { createClient } from "@/lib/supabase/server";
import { PerfilForm } from "@/components/portal/perfil/PerfilForm";
import type { ClientePerfil } from "@/lib/data/portal/cliente";

export default async function PortalPerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: perfil }, { data: puntos }] = await Promise.all([
    supabase.from("clientes_perfil").select("*").eq("id", user.id).maybeSingle<ClientePerfil>(),
    supabase
      .from("suplepuntos_clientes")
      .select("codigo_referido, nivel, referido_por")
      .eq("cliente_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <PerfilForm
      user={user}
      perfilInicial={perfil}
      codigoReferido={puntos?.codigo_referido ?? "—"}
      nivel={puntos?.nivel ?? "basico"}
      yaTieneReferido={!!puntos?.referido_por}
    />
  );
}
