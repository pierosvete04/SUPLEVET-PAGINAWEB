import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { RestrictedSidebar } from "@/components/admin/RestrictedSidebar";
import { SiteHeader } from "@/components/admin/SiteHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

// Roles restringidos (pensados para personal externo) no ven el sidebar
// completo — solo su única sección permitida, con un header minimalista.
// El middleware ya se encarga de rebotarlos si intentan otra ruta /admin/*.
const TITULOS_ROL_RESTRINGIDO: Record<string, string> = {
  oportunidad_negocio: "Oportunidad de negocio",
};

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        <SidebarInset>
          <SiteHeader />
          <main className="flex flex-1 flex-col gap-4 bg-soft-gray p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider className="font-body">
      <AppSidebar admin={{ nombre: admin.nombre, usuario: admin.usuario }} />
      <SidebarInset>
        <SiteHeader />
        <main className="flex flex-1 flex-col gap-4 bg-soft-gray p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
