"use client";

import type * as React from "react";
import Image from "next/image";
import Link from "next/link";
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

interface RestrictedSidebarProps extends React.ComponentProps<typeof Sidebar> {
  admin: { nombre: string; usuario: string };
  titulo: string;
  /** Únicas secciones visibles para este rol — el middleware ya rebota a
   * cualquier otra ruta /admin/* que no empiece con su prefijo permitido. */
  items: NavEntry[];
  homeUrl: string;
}

// Sidebar de roles restringidos (ej. "oportunidad_negocio", "editor",
// pensados para personal externo): solo las secciones que le corresponden.
export function RestrictedSidebar({ admin, titulo, items, homeUrl, ...props }: RestrictedSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href={homeUrl}>
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
        <NavMain items={items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={admin} />
      </SidebarFooter>
    </Sidebar>
  );
}
