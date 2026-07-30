// Única fuente de verdad para la navegación del portal de clientes — antes
// PortalSidebar.tsx y PortalMobileNav.tsx mantenían dos arreglos por
// separado, y con el tiempo terminaron usando nombres distintos para el
// mismo destino (ej. "SuplePoints" en escritorio vs "Puntos" en móvil).
// `mobileTitle` es la única variación permitida, y es explícita: el bottom
// nav tiene mucho menos ancho por ítem que el sidebar.
export interface PortalNavItem {
  title: string;
  mobileTitle?: string;
  url: string;
  icon: string;
  /** Muestra el saldo de SuplePoints como badge junto al ítem. */
  showSaldo?: boolean;
  /** Aparece como acceso directo en el bottom nav móvil (además de en "Más"). */
  mobilePrimary?: boolean;
}

export interface PortalNavSection {
  label: string;
  items: PortalNavItem[];
}

export const PORTAL_NAV_SECTIONS: PortalNavSection[] = [
  {
    label: "Principal",
    items: [
      { title: "Inicio", url: "/mi-cuenta", icon: "home", mobilePrimary: true },
      {
        title: "SuplePoints",
        mobileTitle: "Puntos",
        url: "/mi-cuenta/puntos",
        icon: "star",
        showSaldo: true,
        mobilePrimary: true,
      },
    ],
  },
  {
    label: "Mis Cosas",
    items: [
      { title: "Mis Mascotas", mobileTitle: "Mascotas", url: "/mi-cuenta/mascotas", icon: "pets", mobilePrimary: true },
      { title: "Mis Pedidos", mobileTitle: "Pedidos", url: "/mi-cuenta/pedidos", icon: "shopping_bag", mobilePrimary: true },
    ],
  },
  {
    // Antes se llamaba "Comunidad" sin contener ningún enlace a la comunidad
    // real (/mi-cuenta/comunidad) — ese feed, las historias y el carnet
    // digital existen pero se dejan fuera del menú a propósito hasta definir
    // una estrategia para ellos. El nombre de la sección ahora describe lo
    // que de verdad contiene.
    label: "Recursos",
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

export function esRutaActiva(pathname: string, url: string): boolean {
  if (url === "/mi-cuenta") return pathname === "/mi-cuenta";
  return pathname.startsWith(url);
}
