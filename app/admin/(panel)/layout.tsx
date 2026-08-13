import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioSesion } from "@/lib/supabase/usuario";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { RestrictedSidebar } from "@/components/admin/RestrictedSidebar";
import { SiteHeader } from "@/components/admin/SiteHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

// Roles restringidos (pensados para personal externo) no ven el sidebar
// completo — solo su única sección permitida, con un header minimalista.
// El middleware ya se encarga de rebotarlos si intentan otra ruta /admin/*.
const TITULOS_ROL_RESTRINGIDO: Record<string, string> = {
  oportunidad_negocio: "Oportunidad de negocio",
};

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  // getUsuarioSesion() verifica el JWT localmente en vez de llamar al servidor
  // de Auth, y va envuelto en cache() de React para no repetirse dentro del
  // mismo request. Entre esto y el middleware, entrar al panel pasó de cuatro
  // viajes a Supabase encadenados a uno solo.
  const [supabase, user] = await Promise.all([createClient(), getUsuarioSesion()]);

  if (!user) redirect("/admin/login");

  const { data: admin } = await supabase
    .from("admins")
    .select("nombre, usuario, activo, rol")
    .eq("id", user.id)
    .maybeSingle();

  if (!admin || !admin.activo) redirect("/admin/login");

  const tituloRestringido = TITULOS_ROL_RESTRINGIDO[admin.rol ?? ""];
  if (tituloRestringido) {
    return (
      <SidebarProvider className="font-body">
        <RestrictedSidebar admin={{ nombre: admin.nombre, usuario: admin.usuario }} titulo={tituloRestringido} />
        {/* min-w-0: SidebarInset es un flex item junto al sidebar y por defecto
            no puede encogerse por debajo del ancho de su contenido, así que una
            tabla ancha estiraba TODA la página en vez de scrollear dentro de su
            tarjeta. */}
        <SidebarInset className="min-w-0">
          <SiteHeader />
          <main className="flex flex-1 flex-col gap-4 bg-soft-gray p-4 md:p-6">{children}</main>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider className="font-body">
      <AppSidebar admin={{ nombre: admin.nombre, usuario: admin.usuario }} />
      <SidebarInset className="min-w-0">
        <SiteHeader />
        <main className="flex flex-1 flex-col gap-4 bg-soft-gray p-4 md:p-6">{children}</main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
