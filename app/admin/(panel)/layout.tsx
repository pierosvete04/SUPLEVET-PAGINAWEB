import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: admin } = await supabase
    .from("admins")
    .select("nombre, activo")
    .eq("id", user.id)
    .maybeSingle();

  if (!admin || !admin.activo) redirect("/admin/login");

  return (
    <div className="flex font-body">
      <AdminSidebar />
      <div className="flex min-h-screen flex-1 flex-col bg-soft-gray">
        <header className="flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <div />
          <div className="flex items-center gap-4">
            <span className="font-body text-sm text-secondary">{admin.nombre}</span>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
