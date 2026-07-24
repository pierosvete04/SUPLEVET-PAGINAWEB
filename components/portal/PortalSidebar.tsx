"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NOMBRE_NIVEL } from "@/lib/data/portal/logros";

interface PortalSidebarUsuario {
  nombre: string;
  email: string;
  nivel: string;
  saldo: number;
  fotoUrl: string | null;
}

const NAV_SECTIONS = [
  {
    label: "Principal",
    items: [
      { title: "Inicio", url: "/mi-cuenta", icon: "home" },
      { title: "SuplePoints", url: "/mi-cuenta/puntos", icon: "star", showSaldo: true },
    ],
  },
  {
    label: "Mis Cosas",
    items: [
      { title: "Mis Mascotas", url: "/mi-cuenta/mascotas", icon: "pets" },
      { title: "Mis Pedidos", url: "/mi-cuenta/pedidos", icon: "shopping_bag" },
    ],
  },
  {
    label: "Comunidad",
    items: [
      // { title: "Ranking", url: "/mi-cuenta/ranking", icon: "leaderboard" }, // desactivado temporalmente
      { title: "Cursos", url: "/mi-cuenta/cursos", icon: "school" },
      { title: "Alianzas", url: "/mi-cuenta/alianzas", icon: "handshake" },
    ],
  },
  {
    label: "Cuenta",
    items: [{ title: "Mi Perfil", url: "/mi-cuenta/perfil", icon: "manage_accounts" }],
  },
];

function iniciales(nombre: string): string {
  const base = nombre.trim() || "?";
  return base
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function esActivo(pathname: string, url: string): boolean {
  if (url === "/mi-cuenta") return pathname === "/mi-cuenta";
  return pathname.startsWith(url);
}

export function PortalSidebar({ usuario }: { usuario: PortalSidebarUsuario }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/mi-cuenta/login");
    router.refresh();
  }

  return (
    <aside className="portal-sidebar print:hidden">
      <div className="px-4 pb-3 pt-4">
        <Link href="/mi-cuenta" className="flex items-center justify-center">
          <Image
            src="/logos/logo-white-mixed-horizontal.png"
            alt="Suplevet"
            width={800}
            height={171}
            className="h-auto w-full"
            priority
          />
        </Link>
      </div>

      <Link
        href="/mi-cuenta/perfil"
        className="mx-2 mb-1 flex items-center gap-3 rounded-lg border border-white/10 p-4 transition-all hover:border-transparent hover:bg-gradient-to-r hover:from-portal-orange/25 hover:via-portal-teal-mid/20 hover:to-portal-teal-light/10"
      >
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-portal-orange font-bold text-white">
          {usuario.fotoUrl ? (
            <Image src={usuario.fotoUrl} alt="" fill className="object-cover" sizes="40px" />
          ) : (
            iniciales(usuario.nombre)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{usuario.nombre || "Sin nombre"}</div>
          <div className="mt-0.5 text-xs font-medium text-portal-orange">
            {NOMBRE_NIVEL[usuario.nivel] ?? usuario.nivel}
          </div>
        </div>
        <span className="material-symbols-rounded text-[18px] text-white/50">edit</span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-3 pt-1">
        {NAV_SECTIONS.map((seccion, i) => (
          <div key={seccion.label}>
            <div className={`mb-1.5 px-3 text-xs font-bold uppercase tracking-wider text-white/40 ${i === 0 ? "mt-1" : "mt-3"}`}>
              {seccion.label}
            </div>
            {seccion.items.map((item) => {
              const activo = esActivo(pathname, item.url);
              return (
                <Link key={item.url} href={item.url} className={`portal-nav-item ${activo ? "active" : ""}`}>
                  <span className="material-symbols-rounded text-[20px]">{item.icon}</span>
                  <span className="flex-1">{item.title}</span>
                  {item.showSaldo && usuario.saldo > 0 && (
                    <span className="rounded-full bg-gradient-to-br from-portal-orange to-portal-orange-dark px-2 py-0.5 text-[10px] font-bold text-white">
                      {usuario.saldo.toLocaleString()}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/50 transition-colors portal-sidebar-logout"
        >
          <span className="material-symbols-rounded text-[18px]">logout</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
