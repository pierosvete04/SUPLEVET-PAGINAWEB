"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ITEMS_VISIBLES = [
  { title: "Inicio", url: "/mi-cuenta", icon: "home" },
  { title: "Puntos", url: "/mi-cuenta/puntos", icon: "star" },
  { title: "Mascotas", url: "/mi-cuenta/mascotas", icon: "pets" },
  { title: "Pedidos", url: "/mi-cuenta/pedidos", icon: "shopping_bag" },
];

const ITEMS_MAS = [
  { title: "Ranking", url: "/mi-cuenta/ranking", icon: "leaderboard" },
  { title: "Cursos", url: "/mi-cuenta/cursos", icon: "school" },
  { title: "Alianzas", url: "/mi-cuenta/alianzas", icon: "handshake" },
  { title: "Mi Perfil", url: "/mi-cuenta/perfil", icon: "manage_accounts" },
];

function esActivo(pathname: string, url: string): boolean {
  if (url === "/mi-cuenta") return pathname === "/mi-cuenta";
  return pathname.startsWith(url);
}

export function PortalMobileNav() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const masActivo = ITEMS_MAS.some((item) => esActivo(pathname, item.url));

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
          const activo = esActivo(pathname, item.url);
          return (
            <Link key={item.url} href={item.url} className={`portal-nav-item ${activo ? "active" : ""}`}>
              <span className="material-symbols-rounded text-[22px]">{item.icon}</span>
              <span>{item.title}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMenuAbierto(true)}
          className={`portal-nav-item ${masActivo ? "active" : ""}`}
        >
          <span className="material-symbols-rounded text-[22px]">more_horiz</span>
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
                const activo = esActivo(pathname, item.url);
                return (
                  <Link
                    key={item.url}
                    href={item.url}
                    onClick={() => setMenuAbierto(false)}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-white ${
                      activo ? "bg-portal-orange font-semibold" : "bg-white/5"
                    }`}
                  >
                    <span className="material-symbols-rounded text-[20px]">{item.icon}</span>
                    <span className="text-sm">{item.title}</span>
                  </Link>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-white/60"
            >
              <span className="material-symbols-rounded text-[20px]">logout</span>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </>
  );
}
