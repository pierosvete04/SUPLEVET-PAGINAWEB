"use client";

import Image from "next/image";
import Link from "next/link";
import { useConfiguracionSitio } from "@/hooks/use-configuracion-sitio";

const menuLinks = [
  { label: "Inicio", href: "/" },
  { label: "Productos", href: "/productos" },
  { label: "Ofertas", href: "/ofertas" },
  { label: "Oportunidad de negocio", href: "/oportunidad-de-negocio" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Blog", href: "/blog" },
  { label: "Contáctanos", href: "/contacto" },
];

const policyLinks = [
  { label: "Política de Privacidad", href: "/legal/privacidad" },
  { label: "Política de Envío", href: "/legal/envios" },
  { label: "Política de Devoluciones", href: "/legal/devoluciones" },
  { label: "Términos del Servicio", href: "/legal/terminos" },
  { label: "Preferencias de Cookies", href: "/legal/cookies" },
];

export function Footer() {
  const config = useConfiguracionSitio();

  // Badges circulares blancos con glyph en azul marca (PLAN.md sección 8.8).
  const socialIcons = [
    { label: "Facebook", href: config.facebookUrl, icon: "/icons/social/facebook.png" },
    { label: "Instagram", href: config.instagramUrl, icon: "/icons/social/instagram.png" },
    { label: "TikTok", href: config.tiktokUrl, icon: "/icons/social/tiktok.png" },
  ];

  return (
    <footer className="bg-gradient-to-br from-secondary to-[#0f1b2e] text-secondary-foreground">
      <div className="mx-auto max-w-container px-mobile-margin py-12 text-center md:px-gutter md:py-16 sm:text-left">
        <Image
          src="/logos/logo-white-mixed-horizontal.png"
          alt="Suplevet"
          width={160}
          height={34}
          className="mx-auto sm:mx-0"
        />

        <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div>
            <p className="font-impact text-sm tracking-wide text-accent">MENÚ</p>
            <ul className="mt-4 flex flex-col items-center gap-2 font-body text-sm sm:items-start">
              {menuLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-accent">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-impact text-sm tracking-wide text-accent">POLÍTICAS</p>
            <ul className="mt-4 flex flex-col items-center gap-2 font-body text-sm sm:items-start">
              {policyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-accent">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center sm:justify-start">
            <Link
              href="/legal/libro-de-reclamaciones"
              aria-label="Libro de Reclamaciones"
              className="inline-block transition-opacity hover:opacity-80"
            >
              <Image
                src="/icons/libro-reclamaciones-icon.png"
                alt="Libro de Reclamaciones"
                width={193}
                height={132}
                className="h-[110px] w-auto object-contain"
              />
            </Link>
          </div>
        </div>

        <div className="mt-10 flex justify-center gap-3">
          {socialIcons.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className="transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-110"
            >
              <Image src={social.icon} alt="" width={36} height={36} />
            </a>
          ))}
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center font-body text-xs text-secondary-foreground/60">
          © {new Date().getFullYear()}, SUPLEVET. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
