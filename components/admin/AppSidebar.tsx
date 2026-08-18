"use client";

import type * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Boxes,
  Landmark,
  Share2,
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
  FileText,
  FileWarning,
  Inbox,
  Megaphone,
  BarChart3,
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
  { title: "Pedidos", url: "/admin/pedidos", icon: ShoppingBag },
  { title: "Clientes", url: "/admin/clientes", icon: Users },
  // Productos vive en el primer nivel, fuera de "Catálogo": es de lo que más se
  // edita a diario (precios, stock, fotos) y tenerlo a dos clics dentro de un
  // submenú desplegable lo hacía lento de alcanzar.
  { title: "Productos", url: "/admin/productos", icon: Package },
  {
    title: "Catálogo",
    icon: Boxes,
    items: [
      { title: "Ingredientes", url: "/admin/ingredientes", icon: Leaf },
      { title: "Comparativa", url: "/admin/comparativa", icon: Scale },
      { title: "Resultados reales", url: "/admin/resultados", icon: ImageIcon },
    ],
  },
  {
    title: "Envíos y promociones",
    icon: Truck,
    items: [
      { title: "Envíos", url: "/admin/envios", icon: Truck },
      { title: "Cupones", url: "/admin/cupones", icon: Ticket },
      { title: "Regalos", url: "/admin/regalos", icon: Gift },
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
      { title: "Testimonios", url: "/admin/testimonios", icon: Clapperboard },
      { title: "Reseñas", url: "/admin/resenas", icon: MessageSquareText },
      { title: "Logros", url: "/admin/logros", icon: Trophy },
      { title: "SuplePoints", url: "/admin/suplepuntos", icon: Star },
    ],
  },
  { title: "Editores", url: "/admin/editores", icon: Megaphone },
  { title: "Campañas de Ads", url: "/admin/campanas-ads", icon: BarChart3 },
  {
    title: "Oportunidad de negocio",
    icon: Handshake,
    items: [
      { title: "Contenido web", url: "/admin/oportunidad", icon: FileText },
      { title: "Postulaciones", url: "/admin/oportunidad/postulaciones", icon: Inbox },
    ],
  },
  {
    title: "Configuración",
    icon: Settings,
    items: [
      { title: "General", url: "/admin/configuracion", icon: Settings },
      { title: "Métodos de pago", url: "/admin/configuracion/pagos", icon: Landmark },
      { title: "Redes y contacto", url: "/admin/configuracion/redes", icon: Share2 },
      { title: "Banner principal", url: "/admin/configuracion/banner", icon: GalleryHorizontal },
      // El libro de reclamaciones es una obligación legal que se consulta de vez
      // en cuando, no trabajo diario: ocupaba un lugar en el primer nivel del
      // menú, entre Pedidos y Clientes, que no se corresponde con cuánto se usa.
      { title: "Libro de reclamaciones", url: "/admin/libro-reclamaciones", icon: FileWarning },
    ],
  },
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
