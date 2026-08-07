import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioSesion } from "@/lib/supabase/usuario";
import { inicializarSesionCliente, type ClientePerfil } from "@/lib/data/portal/cliente";
import { CompletarPerfilForm } from "@/components/portal/onboarding/CompletarPerfilForm";

// Paso obligatorio post-registro: el login es solo con correo (ver
// LoginPanel.tsx), así que un cliente nuevo no tiene ni nombre ni forma de
// contacto. Sin este paso, el portal muestra "Hola, {parte del correo}" y
// cualquier pedido carecería de teléfono/dirección para el envío — ver
// app/mi-cuenta/(portal)/layout.tsx, que redirige acá mientras perfil_completo
// sea false.
export default async function CompletarPerfilPage() {
  const supabase = await createClient();
  const user = await getUsuarioSesion();

  if (!user) redirect("/mi-cuenta/login");

  const sesion = await inicializarSesionCliente(supabase);
  if (sesion.esInterna) redirect("/admin");
  if (sesion.perfilCompleto) redirect("/mi-cuenta");

  const { data: perfil } = await supabase
    .from("clientes_perfil")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<ClientePerfil>();

  return <CompletarPerfilForm user={user} perfilInicial={perfil} />;
}
