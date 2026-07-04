import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { SiteHeader } from "@/components/admin/SiteHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: admin } = await supabase
    .from("admins")
    .select("nombre, usuario, activo")
    .eq("id", user.id)
    .maybeSingle();

  if (!admin || !admin.activo) redirect("/admin/login");

  return (
    <SidebarProvider className="font-body">
      <AppSidebar admin={{ nombre: admin.nombre, usuario: admin.usuario }} variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="flex flex-1 flex-col gap-4 bg-soft-gray p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
