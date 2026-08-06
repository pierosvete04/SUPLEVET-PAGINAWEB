"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { GA_MEASUREMENT_ID, GTM_ID } from "@/lib/analytics";

// GA/GTM se excluyen del panel admin (/admin) a propósito: es uso interno
// del equipo, no comportamiento de clientes, y ensuciaría las métricas.
export function AnalyticsScripts() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      {/* Google Tag Manager (noscript) */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>

      {/* Google Tag Manager — el ID de contenedor no es un dato sensible,
          queda visible en el HTML/red de cualquier sitio que use GTM (así
          funciona la herramienta: el navegador debe poder cargarlo).
          `lazyOnload` (no `afterInteractive`) porque GTM arrastra además el
          pixel de Meta y su clientParamBuilder: entre los tres sumaban ~540 KB
          y casi 300 ms de hilo principal peleando con la hidratación de React
          — el Total Blocking Time de 1210 ms que reportó PageSpeed en mobile.
          Con lazyOnload todo eso corre recién después del evento `load`, o sea
          con la página ya pintada y usable. No se pierde ningún evento:
          trackEvent() (lib/analytics.ts) crea window.dataLayer si no existe y
          encola ahí, y GTM procesa la cola entera al inicializarse. */}
      <Script id="gtm" strategy="lazyOnload">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>

      {/* Google Analytics (gtag.js) — mismo criterio de lazyOnload que GTM:
          son otros 164 KB y ~101 ms de hilo principal que no aportan nada al
          primer pintado. */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
      />
      <Script id="ga-gtag" strategy="lazyOnload">
        {`window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_MEASUREMENT_ID}');`}
      </Script>
    </>
  );
}
