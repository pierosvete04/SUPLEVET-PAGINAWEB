import { siteConfig } from "@/lib/site-config";

// JSON-LD a nivel de sitio (no de producto): le dice a Google explícitamente
// que este dominio, el Instagram, el Facebook, el TikTok y el LinkedIn son la
// misma entidad "Suplevet". Sin esto, una búsqueda de marca ("suplevet", sin
// el ".pe") puede mostrar el sitio y las redes como resultados sueltos y sin
// relación en vez de agruparlos bajo una sola entidad — es la pieza que
// faltaba junto con la ficha de Google Business Profile ya verificada.
//
// Se inyecta una sola vez en app/layout.tsx (nivel raíz), no en cada página.

const LOGO_URL = `${siteConfig.siteUrl}/logos/logo-color-horizontal.png`;

export const organizacionSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Suplevet",
  legalName: siteConfig.legal.razonSocial,
  url: siteConfig.siteUrl,
  logo: LOGO_URL,
  image: LOGO_URL,
  description:
    "Suplemento hiperproteico de uso veterinario. Ayuda a fortalecer el sistema inmunológico, la digestión y la vitalidad de tu mascota.",
  address: {
    "@type": "PostalAddress",
    streetAddress: siteConfig.legal.domicilioFiscal,
    addressCountry: "PE",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: `+${siteConfig.whatsappB2C}`,
    contactType: "customer service",
    areaServed: "PE",
    availableLanguage: "Spanish",
  },
  // sameAs es la señal de "entity linking": une la web con cada perfil.
  sameAs: Object.values(siteConfig.redesSociales),
} as const;

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Suplevet",
  url: siteConfig.siteUrl,
} as const;
