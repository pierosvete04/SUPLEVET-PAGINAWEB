"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Package,
  Users,
  ShoppingBag,
  Truck,
  Ticket,
  Gift,
  Newspaper,
  Settings,
} from "lucide-react";

const tabs = [
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/envios", label: "Envíos", icon: Truck },
  { href: "/admin/cupones", label: "Cupones", icon: Ticket },
  { href: "/admin/regalos", label: "Regalos", icon: Gift },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-secondary">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
        <Image src="/logos/logo-white-full-horizontal.png" alt="Suplevet" width={130} height={28} />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {tabs.map((tab) => {
          const activo = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-body text-sm font-bold transition-colors ${
                activo ? "bg-primary text-primary-foreground" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
