"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const TITULOS: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/productos": "Productos",
  "/admin/clientes": "Clientes",
  "/admin/pedidos": "Pedidos",
  "/admin/envios": "Envíos",
  "/admin/cupones": "Cupones",
  "/admin/regalos": "Regalos",
  "/admin/blog": "Blog",
  "/admin/configuracion": "Configuración",
  // Ruta específica antes que la general: ambas empiezan con "/admin/oportunidad".
  "/admin/oportunidad/postulaciones": "Postulaciones",
  "/admin/oportunidad": "Oportunidad de negocio",
};

function tituloDePathname(pathname: string): string {
  const base = Object.keys(TITULOS).find((ruta) => pathname.startsWith(ruta));
  return base ? TITULOS[base] : "Panel administrativo";
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{tituloDePathname(pathname ?? "")}</h1>
      </div>
    </header>
  );
}
