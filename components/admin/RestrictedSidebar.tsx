"use client";

import type * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { NavMain } from "@/components/admin/nav/NavMain";
import { NavUser } from "@/components/admin/nav/NavUser";
import { ROLES_RESTRINGIDOS, type RolRestringido } from "@/lib/admin/roles-restringidos";
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
  rol: RolRestringido;
}

export function RestrictedSidebar({ admin, rol, ...props }: RestrictedSidebarProps) {
  const { titulo, homeUrl, items } = ROLES_RESTRINGIDOS[rol];

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
