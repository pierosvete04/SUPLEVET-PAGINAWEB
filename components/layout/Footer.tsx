import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

const menuLinks = [
  { label: "Inicio", href: "/" },
  { label: "Productos", href: "/productos" },
  { label: "Ofertas", href: "/ofertas" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Blog", href: "/blog" },
  { label: "Contáctanos", href: "/contacto" },
];

const policyLinks = [
  { label: "Política de Privacidad", href: "/legal/privacidad" },
  { label: "Política de Envío", href: "/legal/envios" },
  { label: "Términos del Servicio", href: "/legal/terminos" },
  { label: "Preferencias de Cookies", href: "/legal/cookies" },
];

// Badges circulares blancos con glyph en azul marca (PLAN.md sección 8.8).
const socialIcons = [
  { label: "Facebook", href: siteConfig.redesSociales.facebook, icon: "/icons/social/facebook.png" },
  { label: "Instagram", href: siteConfig.redesSociales.instagram, icon: "/icons/social/instagram.png" },
  { label: "TikTok", href: siteConfig.redesSociales.tiktok, icon: "/icons/social/tiktok.png" },
];

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-container px-mobile-margin py-12 md:px-gutter md:py-16">
        <Image
          src="/logos/logo-white-mixed-horizontal.png"
          alt="Suplevet"
          width={160}
          height={34}
        />

        <div className="mt-10 flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-10 sm:flex-row sm:gap-16">
            <div>
              <p className="font-impact text-sm tracking-wide text-accent">MENÚ</p>
              <ul className="mt-4 flex flex-col gap-2 font-body text-sm">
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
              <ul className="mt-4 flex flex-col gap-2 font-body text-sm">
                {policyLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-accent">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Link
            href="/legal/libro-de-reclamaciones"
            aria-label="Libro de Reclamaciones"
            className="shrink-0 self-start transition-opacity hover:opacity-80 md:self-center"
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

        <div className="mt-10 flex justify-center gap-3">
          {socialIcons.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
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
