"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, ShoppingCart, User } from "lucide-react";
import { mainNav, siteConfig, whatsappLink } from "@/lib/site-config";
import { useCart } from "@/lib/cart/CartContext";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white">
      <div className="mx-auto flex max-w-container items-center justify-between gap-4 px-mobile-margin py-3 md:px-gutter">
        <Link href="/" className="shrink-0">
          <Image
            src="/logos/logo-color-horizontal.png"
            alt="Suplevet"
            width={150}
            height={32}
            priority
          />
        </Link>

        <nav className="hidden items-center gap-6 font-body text-sm font-bold text-secondary lg:flex">
          {mainNav.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={whatsappLink(
              siteConfig.whatsappB2B,
              "Hola, soy veterinario/a y quisiera información de Suplevet"
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-primary px-4 py-2 font-body text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            ¿Eres veterinario? Escríbenos aquí
          </a>
          <Link href="/carrito" aria-label="Carrito" className="relative text-secondary">
            <ShoppingCart className="h-6 w-6" strokeWidth={1.75} />
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {totalItems}
              </span>
            )}
          </Link>
          <a
            href={siteConfig.portalClientesUrl}
            className="flex items-center gap-1 font-body text-sm font-bold text-secondary"
          >
            <User className="h-5 w-5" strokeWidth={1.75} />
            Mi cuenta
          </a>
        </div>

        <button
          type="button"
          className="text-secondary lg:hidden"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-white px-mobile-margin py-4 lg:hidden">
          <nav className="flex flex-col gap-4 font-body text-base font-bold text-secondary">
            {mainNav.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
            <a href={siteConfig.portalClientesUrl} className="flex items-center gap-2">
              <User className="h-5 w-5" strokeWidth={1.75} /> Mi cuenta
            </a>
            <Link href="/carrito" className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" strokeWidth={1.75} /> Carrito
              {totalItems > 0 && ` (${totalItems})`}
            </Link>
            <a
              href={whatsappLink(
                siteConfig.whatsappB2B,
                "Hola, soy veterinario/a y quisiera información de Suplevet"
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-primary px-4 py-3 text-center text-xs text-primary-foreground"
            >
              ¿Eres veterinario? Escríbenos aquí
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
