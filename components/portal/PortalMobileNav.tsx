"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PORTAL_NAV_SECTIONS, esRutaActiva } from "@/lib/portal/nav";
import { PortalIcon } from "@/components/portal/icons/PortalIcon";

// Misma fuente que el sidebar de escritorio (lib/portal/nav.ts) — evita que
// un ítem tenga un nombre en escritorio y otro distinto en móvil por
// mantener dos listas a mano. `mobilePrimary` decide si va en los accesos
// directos del bottom nav o dentro de "Más".
const TODOS_LOS_ITEMS = PORTAL_NAV_SECTIONS.flatMap((s) => s.items);
const ITEMS_VISIBLES = TODOS_LOS_ITEMS.filter((item) => item.mobilePrimary);
const ITEMS_MAS = TODOS_LOS_ITEMS.filter((item) => !item.mobilePrimary);

export function PortalMobileNav() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const masActivo = ITEMS_MAS.some((item) => esRutaActiva(pathname, item.url));

  async function handleLogout() {
    setMenuAbierto(false);
    await createClient().auth.signOut();
    router.push("/mi-cuenta/login");
    router.refresh();
  }

  return (
    <>
      <nav className="portal-mobile-nav print:hidden">
        {ITEMS_VISIBLES.map((item) => {
          const activo = esRutaActiva(pathname, item.url);
          return (
            <Link key={item.url} href={item.url} className={`portal-nav-item ${activo ? "active" : ""}`}>
              <PortalIcon name={item.icon} className="text-[22px]" />
              <span>{item.mobileTitle ?? item.title}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMenuAbierto(true)}
          className={`portal-nav-item ${masActivo ? "active" : ""}`}
        >
          <PortalIcon name="more_horiz" className="text-[22px]" />
          <span>Más</span>
        </button>
      </nav>

      {menuAbierto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuAbierto(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-gradient-to-b from-portal-navy to-portal-navy-dark p-4 pb-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            <div className="grid grid-cols-2 gap-2">
              {ITEMS_MAS.map((item) => {
                const activo = esRutaActiva(pathname, item.url);
                return (
                  <Link
                    key={item.url}
                    href={item.url}
                    onClick={() => setMenuAbierto(false)}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-white ${
                      activo ? "bg-portal-orange font-semibold" : "bg-white/5"
                    }`}
                  >
                    <PortalIcon name={item.icon} className="text-[20px]" />
                    <span className="text-sm">{item.title}</span>
                  </Link>
                );
              })}
            </div>
            <Link
              href="/"
              onClick={() => setMenuAbierto(false)}
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-white/60"
            >
              <PortalIcon name="arrow_back" className="text-[20px]" />
              Regresar a la página web
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-white/60"
            >
              <PortalIcon name="logout" className="text-[20px]" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </>
  );
}
