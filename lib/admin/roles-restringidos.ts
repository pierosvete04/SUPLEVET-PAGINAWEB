import { BarChart3, FileText, History, Inbox, LayoutDashboard, Plus, Ticket } from "lucide-react";
import type { NavEntry } from "@/components/admin/nav/NavMain";

// Roles restringidos (pensados para personal externo): solo las secciones
// que les corresponden. El middleware ya rebota a cualquier otra ruta
// /admin/* que no empiece con su prefijo permitido.
//
// Este archivo es un módulo PLANO (sin "use client") a propósito: tanto
// app/admin/(panel)/layout.tsx (Server Component) como RestrictedSidebar.tsx
// (Client Component) lo importan cada uno por su cuenta. Antes vivía dentro
// de RestrictedSidebar.tsx y el layout lo importaba desde ahí — un módulo
// "use client" no garantiza que sus exports no-componente lleguen intactos
// al importarlos desde el servidor (el bundler puede tratarlos como
// referencias de cliente), y en la práctica el layout terminaba sin poder
// leer el objeto (el `in` fallaba en silencio y todos los roles restringidos
// veían el sidebar completo de admin). Separarlo en un módulo neutral evita
// el problema de raíz.
export const ROLES_RESTRINGIDOS = {
  oportunidad_negocio: {
    titulo: "Oportunidad de negocio",
    homeUrl: "/admin/oportunidad",
    items: [
      { title: "Contenido web", url: "/admin/oportunidad", icon: FileText },
      { title: "Postulaciones", url: "/admin/oportunidad/postulaciones", icon: Inbox },
    ] satisfies NavEntry[],
  },
  editor: {
    titulo: "Panel de editor",
    homeUrl: "/admin/mi-panel",
    items: [
      { title: "Mi dashboard", url: "/admin/mi-panel", icon: LayoutDashboard },
      { title: "Crear pedido", url: "/admin/mi-panel/nuevo", icon: Plus },
      { title: "Ventas", url: "/admin/mi-panel/ventas", icon: Ticket },
      { title: "Historial", url: "/admin/mi-panel/historial", icon: History },
      { title: "Analíticas", url: "/admin/mi-panel/analiticas", icon: BarChart3 },
    ] satisfies NavEntry[],
  },
} as const;

export type RolRestringido = keyof typeof ROLES_RESTRINGIDOS;
