import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/mi-cuenta", "/vet", "/checkout", "/carrito", "/auth", "/b2b"],
    },
    sitemap: `${siteConfig.siteUrl}/sitemap.xml`,
  };
}
