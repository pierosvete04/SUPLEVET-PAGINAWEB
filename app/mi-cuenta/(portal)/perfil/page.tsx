import { createClient } from "@/lib/supabase/server";
import { getUsuarioSesion } from "@/lib/supabase/usuario";
import { PerfilForm } from "@/components/portal/perfil/PerfilForm";
import type { ClientePerfil } from "@/lib/data/portal/cliente";

export default async function PortalPerfilPage() {
  const supabase = await createClient();
  const user = await getUsuarioSesion();
  if (!user) return null;

  const [{ data: perfil }, { data: puntos }] = await Promise.all([
    supabase.from("clientes_perfil").select("*").eq("id", user.id).maybeSingle<ClientePerfil>(),
    supabase
      .from("suplepuntos_clientes")
      .select("codigo_referido, nivel, referido_por, fecha_primera_compra")
      .eq("cliente_id", user.id)
      .maybeSingle(),
  ]);

  // El bono de referido solo se paga en la primera compra
  // (acreditar_puntos_pedido_web lo condiciona a fecha_primera_compra is
  // null), así que a quien ya compró no se le ofrece el recuadro: ingresar
  // un código nunca le acreditaría los 100 pts.
  const yaCompro = !!puntos?.fecha_primera_compra;

  return (
    <PerfilForm
      user={user}
      perfilInicial={perfil}
      codigoReferido={puntos?.codigo_referido ?? "—"}
      nivel={puntos?.nivel ?? "basico"}
      yaTieneReferido={!!puntos?.referido_por}
      yaCompro={yaCompro}
    />
  );
}
