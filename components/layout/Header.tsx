"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShoppingCart, User } from "lucide-react";
import { mainNav, whatsappLink } from "@/lib/site-config";
import { useConfiguracionSitio } from "@/hooks/use-configuracion-sitio";
import { useCart } from "@/lib/cart/CartContext";
import { CartSheet } from "@/components/cart/CartSheet";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { trackEvent } from "@/lib/analytics";
import { gsap } from "@/lib/gsap";

const WHATSAPP_GREEN = "#25D366";

function WhatsappCta({ className = "" }: { className?: string }) {
  const config = useConfiguracionSitio();
  return (
    <a
      href={whatsappLink(
        config.whatsappB2B,
        "Hola, soy veterinario/a y quisiera información de Suplevet"
      )}
      target="_blank"
      rel="noopener noreferrer"
      style={{ backgroundColor: WHATSAPP_GREEN }}
      onClick={() => trackEvent("whatsapp_click", { origen: "header_veterinarias" })}
      className={`flex items-center justify-center gap-2 rounded-[17px] px-5 py-2.5 font-body text-sm font-bold text-white transition-opacity hover:opacity-90 ${className}`}
    >
      <WhatsAppIcon className="h-5 w-5 shrink-0" />
      Veterinarias / Mayoristas
    </a>
  );
}

// Fila de enlaces de navegación (desktop) — se reutiliza en el header completo
// y en la barra condensada que aparece al hacer scroll hacia arriba.
function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex items-center gap-8 font-body text-base font-bold text-secondary-foreground">
      {mainNav.map((item) =>
        item.href === "/ofertas" ? (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="rounded-[17px] bg-accent px-5 py-2 text-accent-foreground transition-opacity hover:opacity-90"
          >
            {item.label}
          </Link>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="group relative py-1 transition-colors hover:text-accent"
          >
            {item.label}
            <span className="absolute -bottom-0.5 left-0 h-0.5 w-full origin-left scale-x-0 bg-accent transition-transform duration-300 ease-out group-hover:scale-x-100" />
          </Link>
        )
      )}
    </nav>
  );
}

// Controles de cuenta + carrito (derecha de la fila superior en mobile).
function AccountCart({
  totalItems,
  onOpenCart,
}: {
  totalItems: number;
  onOpenCart: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/mi-cuenta"
        aria-label="Mi cuenta"
        className="flex items-center gap-2 rounded-[17px] border border-white/30 px-4 py-2.5 font-body text-sm font-bold text-secondary-foreground transition-colors hover:bg-white/10 md:text-base lg:px-5"
      >
        <User className="h-5 w-5 shrink-0" strokeWidth={1.75} />
        <span className="hidden lg:inline">Mi cuenta</span>
      </Link>
      <button
        type="button"
        aria-label="Carrito"
        onClick={onOpenCart}
        className="flex items-center gap-2 rounded-[17px] bg-accent px-4 py-2.5 font-body text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90 md:text-base lg:px-5"
      >
        <ShoppingCart className="h-5 w-5 shrink-0" strokeWidth={1.75} />
        <span className="hidden lg:inline">Carrito</span>
        {totalItems > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
            {totalItems}
          </span>
        )}
      </button>
    </div>
  );
}

// Menú desplegable de navegación en mobile — se reutiliza bajo el header
// completo y bajo la barra condensada.
function MobileMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="border-t border-white/10 bg-gradient-to-br from-secondary to-[#0f1b2e] px-mobile-margin py-4 lg:hidden">
      <nav className="flex flex-col items-start gap-4 font-body text-base font-bold text-secondary-foreground">
        {mainNav.map((item) =>
          item.href === "/ofertas" ? (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="rounded-[17px] bg-accent px-4 py-1.5 text-accent-foreground"
            >
              {item.label}
            </Link>
          ) : (
            <Link key={item.href} href={item.href} onClick={onNavigate}>
              {item.label}
            </Link>
          )
        )}
      </nav>
      <div className="mt-4 border-t border-white/10 pt-4">
        <WhatsappCta className="w-full py-3" />
      </div>
    </div>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  // La barra condensada que se revela al hacer scroll hacia arriba. Oculta al
  // bajar y cuando estamos arriba del todo.
  const [showCondensed, setShowCondensed] = useState(false);
  // Cuando se esconde por llegar al tope (donde reaparece el header real), el
  // relevo debe ser instantáneo (sin la transición de 300ms) para que las dos
  // barras no se solapen y "rayen". Al revelarse subiendo sí queremos la
  // transición suave.
  const [condensedInstant, setCondensedInstant] = useState(true);
  const { totalItems } = useCart();
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const condensedRef = useRef<HTMLDivElement>(null);

  // Cierra el menú mobile en cualquier cambio de ruta.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Entrada del sitio: el header completo aparece deslizándose al montar.
  // Solo una vez por sesión (flag en sessionStorage, marcado en onComplete
  // para no chocar con el doble montaje de React StrictMode en dev).
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      sessionStorage.getItem("intro-header-visto")
    ) {
      gsap.set(el, { opacity: 1, yPercent: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { yPercent: -100, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          onComplete: () => sessionStorage.setItem("intro-header-visto", "1"),
        }
      );
    });
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Comportamiento de scroll: el header completo NO es fijo (se va con la
  // página al bajar). La barra condensada se revela solo al subir, y se
  // esconde al bajar o cuando el header completo todavía está a la vista.
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const DELTA = 5; // ignora micro-movimientos para no parpadear

    function update() {
      const y = window.scrollY;
      const el = headerRef.current;
      // Punto donde el header completo ya terminó de salir de pantalla.
      const headerBottom = el ? el.offsetTop + el.offsetHeight : 180;

      if (y <= headerBottom) {
        // Tope: el header real reaparece — esconder al instante (sin animar)
        // para que el relevo sea limpio, no un solape de dos barras.
        setCondensedInstant(true);
        setShowCondensed(false);
      } else if (y < lastY - DELTA) {
        setCondensedInstant(false);
        setShowCondensed(true); // subiendo → revela con transición suave
      } else if (y > lastY + DELTA) {
        setCondensedInstant(false);
        setShowCondensed(false); // bajando
        setMenuOpen(false);
      }

      if (Math.abs(y - lastY) > DELTA) lastY = y;
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cierra el menú al hacer click fuera (contempla header completo y barra
  // condensada, ya que ambos pueden abrir el menú).
  useEffect(() => {
    if (!menuOpen) return;
    function onClickFuera(e: MouseEvent) {
      const target = e.target as Node;
      const dentro =
        headerRef.current?.contains(target) || condensedRef.current?.contains(target);
      if (!dentro) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, [menuOpen]);

  return (
    <>
      {/* Header completo — flujo normal, NO fijo: se va con la página al bajar. */}
      <header
        ref={headerRef}
        style={{ opacity: 0 }}
        className="relative z-40 bg-gradient-to-br from-secondary to-[#0f1b2e] text-secondary-foreground"
      >
        <div className="mx-auto flex max-w-container items-center justify-between gap-4 px-mobile-margin py-4 md:px-gutter md:py-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-secondary-foreground lg:hidden"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
            </button>

            <Link href="/" className="shrink-0">
              <Image
                src="/logos/logo-white-mixed-horizontal.png"
                alt="Suplevet"
                width={195}
                height={42}
                priority
                className="h-auto w-[150px] md:w-[195px]"
              />
            </Link>
          </div>

          <AccountCart totalItems={totalItems} onOpenCart={() => setCarritoAbierto(true)} />
        </div>

        <div className="hidden border-t border-white/10 lg:block">
          <div className="mx-auto flex max-w-container items-center justify-between px-mobile-margin py-4 md:px-gutter">
            <NavLinks />
            <WhatsappCta />
          </div>
        </div>

        {menuOpen && <MobileMenu onNavigate={() => setMenuOpen(false)} />}
      </header>

      {/* Barra condensada — fija, se revela al subir y se esconde al bajar.
          En desktop muestra solo los enlaces + Veterinarias (sin logo); en
          mobile es idéntica al navbar (hamburguesa + logo + cuenta/carrito). */}
      <div
        ref={condensedRef}
        aria-hidden={!showCondensed}
        className={`fixed inset-x-0 top-0 z-50 bg-gradient-to-br from-secondary to-[#0f1b2e] text-secondary-foreground shadow-[0_4px_20px_rgba(0,0,0,0.25)] ${
          condensedInstant ? "" : "transition-transform duration-300 ease-out"
        } ${showCondensed ? "translate-y-0" : "-translate-y-full"}`}
      >
        {/* Desktop: enlaces + Veterinarias / Mayoristas */}
        <div className="mx-auto hidden max-w-container items-center justify-between px-mobile-margin py-4 md:px-gutter lg:flex">
          <NavLinks />
          <WhatsappCta />
        </div>

        {/* Mobile: idéntica al navbar — hamburguesa + logo + cuenta/carrito */}
        <div className="mx-auto flex max-w-container items-center justify-between gap-4 px-mobile-margin py-4 md:px-gutter lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-secondary-foreground"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
            </button>
            <Link href="/" className="shrink-0">
              <Image
                src="/logos/logo-white-mixed-horizontal.png"
                alt="Suplevet"
                width={195}
                height={42}
                className="h-auto w-[150px]"
              />
            </Link>
          </div>
          <AccountCart totalItems={totalItems} onOpenCart={() => setCarritoAbierto(true)} />
        </div>

        {menuOpen && <MobileMenu onNavigate={() => setMenuOpen(false)} />}
      </div>

      <CartSheet open={carritoAbierto} onOpenChange={setCarritoAbierto} />
    </>
  );
}
