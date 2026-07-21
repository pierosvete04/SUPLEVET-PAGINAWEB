import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RotuloPedido } from "@/components/admin/pedidos/RotuloPedido";
import type { PedidoAdmin } from "@/lib/data/pedidos-admin";

// Vive fuera del grupo (panel) a propósito: la hoja que se imprime no debe
// arrastrar el sidebar ni el header del panel. Por eso tampoco hereda el
// guard de (panel)/layout.tsx y tiene que repetirlo acá.
export default async function AdminRotuloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: admin } = await supabase
    .from("admins")
    .select("activo")
    .eq("id", user.id)
    .maybeSingle();
  if (!admin || !admin.activo) redirect("/admin/login");

  const { data: pedido } = await supabase.from("pedidos").select("*").eq("id", id).maybeSingle();
  if (!pedido) notFound();

  return <RotuloPedido pedido={pedido as PedidoAdmin} />;
}
