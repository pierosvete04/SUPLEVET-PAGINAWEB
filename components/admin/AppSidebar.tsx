"use client";

import type * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Users,
  ShoppingBag,
  Truck,
  Ticket,
  Gift,
  GalleryHorizontal,
  Newspaper,
  Settings,
  LayoutDashboard,
  ExternalLink,
  Clapperboard,
  MessageSquareText,
  GraduationCap,
  Star,
  Trophy,
  HelpCircle,
  Leaf,
  Scale,
  ImageIcon,
  Heart,
  Layers,
  Handshake,
} from "lucide-react";
import { NavMain, type NavEntry } from "@/components/admin/nav/NavMain";
import { NavSecondary } from "@/components/admin/nav/NavSecondary";
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

const navMain: NavEntry[] = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  {
    title: "Catálogo",
    icon: Package,
    items: [
      { title: "Productos", url: "/admin/productos", icon: Package },
      { title: "Ingredientes", url: "/admin/ingredientes", icon: Leaf },
      { title: "Comparativa", url: "/admin/comparativa", icon: Scale },
      { title: "Resultados reales", url: "/admin/resultados", icon: ImageIcon },
    ],
  },
  {
    title: "Ventas",
    icon: ShoppingBag,
    items: [
      { title: "Pedidos", url: "/admin/pedidos", icon: ShoppingBag },
      { title: "Envíos", url: "/admin/envios", icon: Truck },
      { title: "Cupones", url: "/admin/cupones", icon: Ticket },
      { title: "Regalos", url: "/admin/regalos", icon: Gift },
    ],
  },
  {
    title: "Clientes",
    icon: Users,
    items: [
      { title: "Clientes", url: "/admin/clientes", icon: Users },
      { title: "Testimonios", url: "/admin/testimonios", icon: Clapperboard },
      { title: "Reseñas", url: "/admin/resenas", icon: MessageSquareText },
      { title: "Logros", url: "/admin/logros", icon: Trophy },
      { title: "SuplePoints", url: "/admin/suplepuntos", icon: Star },
    ],
  },
  {
    title: "Contenido",
    icon: Layers,
    items: [
      { title: "Banners", url: "/admin/banners", icon: GalleryHorizontal },
      { title: "Blog", url: "/admin/blog", icon: Newspaper },
      { title: "Cursos", url: "/admin/cursos", icon: GraduationCap },
      { title: "FAQs", url: "/admin/faqs", icon: HelpCircle },
      { title: "Nosotros", url: "/admin/nosotros", icon: Heart },
      { title: "Oportunidad de negocio", url: "/admin/oportunidad", icon: Handshake },
    ],
  },
  { title: "Configuración", url: "/admin/configuracion", icon: Settings },
];

const navSecondary = [{ title: "Ver sitio web", url: "/", icon: ExternalLink, nuevaPestana: true }];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  admin: { nombre: string; usuario: string };
}

export function AppSidebar({ admin, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/admin/dashboard">
                <Image
                  src="/logos/icon-only/icon-white.png"
                  alt=""
                  width={20}
                  height={20}
                  className="shrink-0"
                />
                <span className="text-base font-semibold">Suplevet Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={admin} />
      </SidebarFooter>
    </Sidebar>
  );
}
