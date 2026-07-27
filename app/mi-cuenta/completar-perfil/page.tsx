import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asegurarFilasCliente, esCuentaInterna, type ClientePerfil } from "@/lib/data/portal/cliente";
import { CompletarPerfilForm } from "@/components/portal/onboarding/CompletarPerfilForm";

// Paso obligatorio post-registro: el login es solo con correo (ver
// LoginPanel.tsx), así que un cliente nuevo no tiene ni nombre ni forma de
// contacto. Sin este paso, el portal muestra "Hola, {parte del correo}" y
// cualquier pedido carecería de teléfono/dirección para el envío — ver
// app/mi-cuenta/(portal)/layout.tsx, que redirige acá mientras perfil_completo
// sea false.
export default async function CompletarPerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/mi-cuenta/login");
  if (await esCuentaInterna(supabase, user.id)) redirect("/admin");

  await asegurarFilasCliente(supabase, user.id);

  const { data: perfil } = await supabase
    .from("clientes_perfil")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<ClientePerfil>();

  if (perfil?.perfil_completo) redirect("/mi-cuenta");

  return <CompletarPerfilForm user={user} perfilInicial={perfil} />;
}
