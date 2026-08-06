import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { inicializarSesionCliente } from "@/lib/data/portal/cliente";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { PortalMobileNav } from "@/components/portal/PortalMobileNav";
import { PortalToaster } from "@/components/portal/notificaciones/PortalToaster";
import { NotificationCenter } from "@/components/portal/notificaciones/NotificationCenter";
import { contarNoLeidas } from "@/lib/data/portal/notificaciones";
import "./portal-theme.css";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/mi-cuenta/login");

  // Un solo round-trip: descarta cuentas internas (admins/vendedores comparten
  // auth.users con los clientes), garantiza clientes_perfil/suplepuntos_clientes
  // aunque la sesión no venga del login del portal (ej. OTP del checkout) y
  // devuelve perfil_completo — ver lib/data/portal/cliente.ts.
  const [sesion, { data: perfil }, { data: puntos }, noLeidas] = await Promise.all([
    inicializarSesionCliente(supabase),
    supabase
      .from("clientes_perfil")
      .select("nombre, apellido, foto_url")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("suplepuntos_clientes").select("saldo_actual, nivel").eq("cliente_id", user.id).maybeSingle(),
    contarNoLeidas(supabase, user.id),
  ]);

  if (sesion.esInterna) redirect("/admin");

  // Cliente nuevo (login solo con correo, sin nombre ni contacto): antes de
  // ver cualquier página del portal completa lo esencial para un pedido — ver
  // app/mi-cuenta/completar-perfil/page.tsx.
  if (!sesion.perfilCompleto) redirect("/mi-cuenta/completar-perfil");

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
      <div className="portal-shell flex min-h-screen font-body">
        <PortalSidebar usuario={usuario} />
        <main className="portal-main-content relative min-w-0 flex-1 overflow-x-hidden p-6 md:p-10">
          <div className="w-full space-y-10">{children}</div>
        </main>
        <PortalMobileNav />
      </div>
      <NotificationCenter userId={user.id} noLeidasIniciales={noLeidas} />
      <PortalToaster />
    </>
  );
}
