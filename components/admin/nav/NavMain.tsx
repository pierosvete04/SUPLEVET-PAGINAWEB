"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ChevronRight, type LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export interface NavLeaf {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface NavGroup {
  title: string;
  icon: LucideIcon;
  items: NavLeaf[];
}

export type NavEntry = NavLeaf | NavGroup;

function esGrupo(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

function urlActivaEn(pathname: string | null, urls: string[]): string | undefined {
  return urls
    .filter((url) => pathname === url || pathname?.startsWith(`${url}/`))
    .sort((a, b) => b.length - a.length)[0];
}

interface NavMainProps {
  items: NavEntry[];
}

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname();
  const { state, setOpen } = useSidebar();

  // Una sola URL "ganadora" en TODO el árbol (hojas sueltas + hojas dentro de
  // grupos) — antes cada botón se comparaba solo, así que en "/admin/mi-panel/nuevo"
  // tanto "Mi dashboard" (/admin/mi-panel, prefijo válido) como "Crear pedido"
  // (match exacto) quedaban resaltados a la vez. Al competir todas las URLs
  // juntas por la coincidencia más larga, gana una sola.
  const urlActivaGlobal = useMemo(() => {
    const todasLasUrls = items.flatMap((entry) => (esGrupo(entry) ? entry.items.map((leaf) => leaf.url) : entry.url));
    return urlActivaEn(pathname, todasLasUrls);
  }, [items, pathname]);

  // Grupo al que pertenece la ruta actual, para abrir el drill-down
  // automáticamente al entrar directo por URL a una página del grupo.
  const grupoActivo = useMemo(() => {
    const grupo = items.find(
      (entry): entry is NavGroup => esGrupo(entry) && entry.items.some((leaf) => leaf.url === urlActivaGlobal)
    );
    return grupo?.title ?? null;
  }, [items, urlActivaGlobal]);

  const [grupoAbierto, setGrupoAbierto] = useState<string | null>(grupoActivo);

  useEffect(() => {
    if (grupoActivo) setGrupoAbierto(grupoActivo);
  }, [grupoActivo]);

  const grupoActual = items.find(
    (entry): entry is NavGroup => esGrupo(entry) && entry.title === grupoAbierto
  );

  if (grupoActual) {
    return (
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Volver al menú principal" onClick={() => setGrupoAbierto(null)}>
                <ArrowLeft />
                <span>Volver al menú principal</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarMenu>
            {grupoActual.items.map((leaf) => {
              const activo = leaf.url === urlActivaGlobal;
              return (
                <SidebarMenuItem key={leaf.url}>
                  <SidebarMenuButton
                    asChild
                    tooltip={leaf.title}
                    isActive={activo}
                    className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                  >
                    <Link href={leaf.url}>
                      <leaf.icon />
                      <span>{leaf.title}</span>
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

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((entry) => {
            if (esGrupo(entry)) {
              const activo = entry.title === grupoActivo;
              return (
                <SidebarMenuItem key={entry.title}>
                  <SidebarMenuButton
                    tooltip={entry.title}
                    isActive={activo}
                    className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                    onClick={() => {
                      if (state === "collapsed") setOpen(true);
                      setGrupoAbierto(entry.title);
                    }}
                  >
                    <entry.icon />
                    <span>{entry.title}</span>
                    <ChevronRight className="ml-auto size-4 shrink-0 opacity-60 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            const activo = entry.url === urlActivaGlobal;
            return (
              <SidebarMenuItem key={entry.url}>
                <SidebarMenuButton
                  asChild
                  tooltip={entry.title}
                  isActive={activo}
                  className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                >
                  <Link href={entry.url}>
                    <entry.icon />
                    <span>{entry.title}</span>
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
