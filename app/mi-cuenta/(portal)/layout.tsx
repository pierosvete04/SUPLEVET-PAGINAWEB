import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asegurarFilasCliente } from "@/lib/data/portal/cliente";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { PortalMobileNav } from "@/components/portal/PortalMobileNav";
import "./portal-theme.css";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/mi-cuenta/login");

  // Garantiza clientes_perfil/suplepuntos_clientes incluso si la sesión no
  // vino del login del portal (ej. OTP del checkout) — ver lib/data/portal/cliente.ts.
  await asegurarFilasCliente(supabase, user.id);

  const [{ data: perfil }, { data: puntos }] = await Promise.all([
    supabase.from("clientes_perfil").select("nombre, apellido, foto_url").eq("id", user.id).maybeSingle(),
    supabase.from("suplepuntos_clientes").select("saldo_actual, nivel").eq("cliente_id", user.id).maybeSingle(),
  ]);

  const nombre = [perfil?.nombre, perfil?.apellido].filter(Boolean).join(" ");
  const usuario = {
    nombre,
    email: user.email ?? "",
    nivel: puntos?.nivel ?? "basico",
    saldo: puntos?.saldo_actual ?? 0,
    fotoUrl: perfil?.foto_url ?? null,
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,300..700,0..1,-50..200"
        rel="stylesheet"
      />
      <div className="portal-shell flex min-h-screen font-body">
        <PortalSidebar usuario={usuario} />
        <main className="portal-main-content relative min-w-0 flex-1 overflow-x-hidden p-6 md:p-10">
          <div className="max-w-6xl space-y-10">{children}</div>
        </main>
        <PortalMobileNav />
      </div>
    </>
  );
}
