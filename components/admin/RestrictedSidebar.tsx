"use client";

import type * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { FileText, Inbox } from "lucide-react";
import { NavMain, type NavEntry } from "@/components/admin/nav/NavMain";
import { NavUser } from "@/components/admin/nav/NavUser";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Sidebar de roles restringidos (ej. "oportunidad_negocio", pensado para
// personal externo): solo las 2 secciones que le corresponden, nada más.
// El middleware ya rebota a cualquier otra ruta /admin/*.
const navMain: NavEntry[] = [
  { title: "Contenido web", url: "/admin/oportunidad", icon: FileText },
  { title: "Postulaciones", url: "/admin/oportunidad/postulaciones", icon: Inbox },
];

interface RestrictedSidebarProps extends React.ComponentProps<typeof Sidebar> {
  admin: { nombre: string; usuario: string };
  titulo: string;
}

export function RestrictedSidebar({ admin, titulo, ...props }: RestrictedSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/admin/oportunidad">
                <Image
                  src="/logos/icon-only/icon-white.png"
                  alt=""
                  width={20}
                  height={20}
                  className="shrink-0"
                />
                <span className="text-base font-semibold">{titulo}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={admin} />
      </SidebarFooter>
    </Sidebar>
  );
}
