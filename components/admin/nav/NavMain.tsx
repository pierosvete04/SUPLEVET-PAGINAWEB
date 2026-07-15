"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavMainProps {
  items: { title: string; url: string; icon: LucideIcon }[];
}

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname();

  // El item activo es el que tenga el prefijo de ruta más largo que
  // coincida — así "/mi-cuenta" (Inicio) no queda marcado junto con
  // "/mi-cuenta/perfil" solo por ser un prefijo de este último.
  const urlActiva = items
    .map((item) => item.url)
    .filter((url) => pathname === url || pathname?.startsWith(`${url}/`))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const activo = item.url === urlActiva;
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={activo}
                  className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                >
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
