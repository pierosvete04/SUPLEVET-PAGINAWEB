import Image from "next/image";

const HERO_BANNER_DESKTOP_FALLBACK = "/images/hero/banner-nuevas-presentaciones.png";
const HERO_BANNER_MOBILE_FALLBACK = "/images/hero/banner-nuevas-presentaciones-mobile.png";

interface HeroProps {
  bannerDesktop?: string | null;
  bannerMobile?: string | null;
}

// El banner se muestra a su proporción natural (ancho completo, alto
// automático) — nada de forzar 16:9/9:16 con object-contain, que dejaba
// franjas blancas (letterbox) arriba y abajo cuando la imagen no calzaba
// exacto con esa proporción. width/height son solo la relación de aspecto
// tentativa para reservar espacio antes de cargar (anti-CLS); al cargar, la
// altura real la define la imagen gracias a `h-auto`.
export function Hero({ bannerDesktop, bannerMobile }: HeroProps) {
  const desktopSrc = bannerDesktop || HERO_BANNER_DESKTOP_FALLBACK;
  const mobileSrc = bannerMobile || HERO_BANNER_MOBILE_FALLBACK;

  return (
    <section className="bg-white pt-2 md:pt-3">
      <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
        <a
          href="#combos"
          aria-label="Ver combos de Suplevet - Nuevas presentaciones"
          className="group block w-full overflow-hidden rounded-[17px]"
        >
          <Image
            src={mobileSrc}
            alt="Nuevas presentaciones Suplevet — empaque de 150 gr y 250 gr"
            width={1080}
            height={1080}
            priority
            className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.03] md:hidden"
            sizes="100vw"
          />
          <Image
            src={desktopSrc}
            alt="Nuevas presentaciones Suplevet — empaque de 150 gr y 250 gr"
            width={3563}
            height={1325}
            priority
            className="hidden h-auto w-full transition-transform duration-300 group-hover:scale-[1.03] md:block"
            sizes="100vw"
          />
        </a>
      </div>
    </section>
  );
}
