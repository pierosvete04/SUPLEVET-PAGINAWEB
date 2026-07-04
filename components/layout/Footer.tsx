import Image from "next/image";
import Link from "next/link";
import { Linkedin } from "lucide-react";
import { siteConfig, whatsappLink } from "@/lib/site-config";

const menuLinks = [
  { label: "Inicio", href: "/" },
  { label: "Productos", href: "/productos" },
  { label: "Ofertas", href: "/ofertas" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Blog", href: "/blog" },
  { label: "Contacto", href: "/contacto" },
];

const legalLinks = [
  { label: "Política de Privacidad", href: "/legal/privacidad" },
  { label: "Política de Cookies", href: "/legal/cookies" },
  { label: "Política de Envíos", href: "/legal/envios" },
  { label: "Términos y Condiciones", href: "/legal/terminos" },
  { label: "Libro de Reclamaciones", href: "/legal/libro-de-reclamaciones" },
];

// Badges circulares blancos con glyph en azul marca (PLAN.md sección 8.8).
// LinkedIn no vino en el set de assets — se arma con lucide-react (8.10) pero
// con el mismo tratamiento visual de badge que los otros 4, para no desentonar.
const socialIcons = [
  { label: "Facebook", href: siteConfig.redesSociales.facebook, icon: "/icons/social/facebook.png" },
  { label: "Instagram", href: siteConfig.redesSociales.instagram, icon: "/icons/social/instagram.png" },
  { label: "TikTok", href: siteConfig.redesSociales.tiktok, icon: "/icons/social/tiktok.png" },
  { label: "WhatsApp", href: whatsappLink(siteConfig.whatsappB2C), icon: "/icons/social/whatsapp-circle.png" },
];

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-container px-mobile-margin py-12 md:px-gutter md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <Image
              src="/logos/logo-white-mixed-horizontal.png"
              alt="Suplevet"
              width={160}
              height={34}
            />
            <p className="mt-4 max-w-xs font-body text-sm text-secondary-foreground/70">
              Nutrición funcional para fortalecer la salud de tu mascota desde adentro.
            </p>
            <div className="mt-5 flex gap-3">
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
              <a
                href={siteConfig.redesSociales.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-secondary"
              >
                <Linkedin className="h-5 w-5" strokeWidth={1.75} />
              </a>
            </div>
          </div>

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
            <p className="font-impact text-sm tracking-wide text-accent">LEGAL</p>
            <ul className="mt-4 flex flex-col gap-2 font-body text-sm">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-accent">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-impact text-sm tracking-wide text-accent">SÍGUENOS</p>
            <p className="mt-4 font-body text-sm text-secondary-foreground/70">
              {siteConfig.legal.razonSocial}
              <br />
              RUC {siteConfig.legal.ruc}
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 font-body text-xs text-secondary-foreground/60">
          © {new Date().getFullYear()} Suplevet — {siteConfig.legal.razonSocial}. Todos los derechos
          reservados.
        </div>
      </div>
    </footer>
  );
}
