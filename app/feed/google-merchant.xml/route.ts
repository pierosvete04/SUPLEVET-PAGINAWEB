import { NextResponse } from "next/server";
import { createStaticClient } from "@/lib/supabase/static";
import { siteConfig } from "@/lib/site-config";

// Feed único en formato Google Shopping (RSS 2.0 + namespace g:). Google
// Merchant Center, Meta Commerce Manager y TikTok Catalog Manager aceptan
// este mismo formato vía "fetch programado de URL" (Shopify hacía esto
// automáticamente con sus apps de canal; aquí lo reemplaza este endpoint),
// así que una sola fuente alimenta las tres plataformas.
export const revalidate = 3600;

const MARCA = "Suplevet";
// "Animals & Pet Supplies > Pet Supplies > Pet Vitamins & Supplements" en la
// taxonomía de Google (https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt)
const CATEGORIA_GOOGLE = "5081";

interface ProductoFeedRow {
  slug: string;
  nombre: string;
  descripcion: string;
  categoria: "producto" | "combo";
  precio: number;
  precio_comparacion: number;
  imagen: string;
  galeria: string[];
  sku: string | null;
  stock: number | null;
}

function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(texto: string): string {
  return `<![CDATA[${texto.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

function construirItem(p: ProductoFeedRow): string {
  const url = `${siteConfig.siteUrl}/productos/${p.slug}`;
  const enOferta = p.precio_comparacion > p.precio;
  const disponibilidad = p.stock === 0 ? "out of stock" : "in stock";
  // La imagen principal no debe repetirse como "adicional".
  const imagenesAdicionales = p.galeria.filter((img) => img !== p.imagen).slice(0, 10);
  const tipoProducto =
    p.categoria === "combo" ? "Suplementos para mascotas > Combos" : "Suplementos para mascotas";

  return `
    <item>
      <g:id>${escaparXml(p.slug)}</g:id>
      <title>${cdata(p.nombre)}</title>
      <description>${cdata(p.descripcion || p.nombre)}</description>
      <link>${escaparXml(url)}</link>
      <g:image_link>${escaparXml(p.imagen)}</g:image_link>
      ${imagenesAdicionales
        .map((img) => `<g:additional_image_link>${escaparXml(img)}</g:additional_image_link>`)
        .join("\n      ")}
      <g:availability>${disponibilidad}</g:availability>
      <g:price>${(enOferta ? p.precio_comparacion : p.precio).toFixed(2)} PEN</g:price>
      ${enOferta ? `<g:sale_price>${p.precio.toFixed(2)} PEN</g:sale_price>` : ""}
      <g:condition>new</g:condition>
      <g:brand>${escaparXml(MARCA)}</g:brand>
      <g:identifier_exists>${p.sku ? "yes" : "no"}</g:identifier_exists>
      ${p.sku ? `<g:mpn>${escaparXml(p.sku)}</g:mpn>` : ""}
      <g:google_product_category>${CATEGORIA_GOOGLE}</g:google_product_category>
      <g:product_type>${cdata(tipoProducto)}</g:product_type>
      <g:is_bundle>${p.categoria === "combo" ? "yes" : "no"}</g:is_bundle>
    </item>`;
}

export async function GET() {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from("productos_web")
    .select(
      "slug, nombre, descripcion, categoria, precio, precio_comparacion, imagen, galeria, sku, stock"
    )
    .eq("activo", true)
    .order("orden", { ascending: true });

  const productos = (data as ProductoFeedRow[]) ?? [];
  const items = productos.map(construirItem).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>Suplevet — Catálogo de productos</title>
  <link>${siteConfig.siteUrl}</link>
  <description>Feed de productos Suplevet para Google Merchant Center, Meta Commerce Manager y TikTok Catalog Manager.</description>
${items}
</channel>
</rss>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=UTF-8" },
  });
}
