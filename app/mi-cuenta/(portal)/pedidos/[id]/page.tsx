import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, CreditCard, Gift, MapPin, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatFecha } from "@/lib/portal/formato";
import { formatPrecio } from "@/lib/data/productos-shared";
import { ESTADO_PEDIDO, estadoParaMostrar } from "@/lib/data/portal/pedidos";
import { getProductos } from "@/lib/data/productos";
import { getVariantesPorSlugs } from "@/lib/regalo-variantes";
import { etiquetaCorta } from "@/lib/documento";

interface DireccionEnvio {
  departamento?: string;
  provincia?: string;
  distrito?: string;
  direccion?: string;
  direccionSecundaria?: string;
  codigoPostal?: string;
  metodoEnvio?: string;
  tipoDocumento?: string | null;
  numeroDocumento?: string | null;
}

const METODO_ENVIO_LABEL: Record<string, string> = {
  motorizado: "Delivery motorizado",
  shalom: "Agencia Shalom",
};

interface ProductoPedidoDetalle {
  nombre?: string;
  name?: string;
  cantidad?: number;
  precio?: number;
  producto_id?: string | null;
}

interface PedidoDetalle {
  id: string;
  shopify_order_number: string | null;
  shopify_order_id: string | null;
  estado: string;
  estado_pago: string | null;
  forma_pago: string | null;
  total: number;
  productos: ProductoPedidoDetalle[];
  puntos_acreditados: number | null;
  fecha_agotamiento_estimada: string | null;
  fecha_pago: string | null;
  direccion_envio: DireccionEnvio | null;
  zona_envio: string | null;
  regalo_bandana: string | null;
  regalo_bandanas: { slug: string; talla: string | null }[] | null;
  created_at: string;
}

const FORMA_PAGO_LABEL: Record<string, string> = {
  tarjeta: "Tarjeta de crédito/débito",
  yape_plin: "Yape / Plin",
  transferencia: "Transferencia bancaria",
  contra_entrega: "Pago contra entrega",
  shopify: "Checkout de Shopify",
};

// Página de detalle de un pedido del portal de cliente — muestra lo que la
// tarjeta resumen de /mi-cuenta/pedidos no alcanza a mostrar: método de pago,
// dirección de envío usada y el regalo ganado (si aplica). Solo pedidos del
// canal "tienda" tienen esta información estructurada (los de veterinaria
// viven en otra tabla sin estos campos), por eso el listado solo enlaza acá
// para ese canal.
export default async function PortalPedidoDetalleRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: pedido }, catalogo] = await Promise.all([
    supabase
      .from("pedidos")
      .select(
        "id, shopify_order_number, shopify_order_id, estado, estado_pago, forma_pago, total, productos, puntos_acreditados, fecha_agotamiento_estimada, fecha_pago, direccion_envio, zona_envio, regalo_bandana, regalo_bandanas, created_at"
      )
      .eq("id", id)
      .eq("cliente_id", user.id)
      .maybeSingle(),
    getProductos(),
  ]);

  if (!pedido) notFound();

  const p = pedido as unknown as PedidoDetalle;
  const slugsBandanas = p.regalo_bandanas?.length
    ? p.regalo_bandanas.map((b) => b.slug)
    : p.regalo_bandana
      ? [p.regalo_bandana]
      : [];
  const bandanasRegalo = await getVariantesPorSlugs(supabase, slugsBandanas);

  const imagenPorShopifyId = new Map(
    catalogo.filter((prod) => prod.shopifyProductId).map((prod) => [prod.shopifyProductId as string, prod.imagen])
  );
  const imagenPorNombre = new Map(catalogo.map((prod) => [prod.nombre.toLowerCase(), prod.imagen]));

  function resolverImagen(productoShopifyId: string | null | undefined, nombre: string): string | null {
    if (productoShopifyId && imagenPorShopifyId.has(productoShopifyId)) {
      return imagenPorShopifyId.get(productoShopifyId) ?? null;
    }
    return imagenPorNombre.get(nombre.toLowerCase()) ?? null;
  }

  const estado = ESTADO_PEDIDO[estadoParaMostrar(p)] ?? ESTADO_PEDIDO.pagado;
  const productos = Array.isArray(p.productos) ? p.productos : [];
  const direccion = p.direccion_envio;
  const direccionTexto = direccion
    ? [
        direccion.direccion,
        direccion.direccionSecundaria,
        direccion.distrito,
        direccion.provincia,
        direccion.departamento,
        direccion.codigoPostal ? `CP ${direccion.codigoPostal}` : null,
      ]
        .filter(Boolean)
        .join(", ")
    : null;
  const metodoEnvioTexto = direccion?.metodoEnvio
    ? (METODO_ENVIO_LABEL[direccion.metodoEnvio] ?? direccion.metodoEnvio)
    : null;
  const documentoTexto = direccion?.numeroDocumento
    ? `${etiquetaCorta(direccion.tipoDocumento)} ${direccion.numeroDocumento}`
    : null;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/mi-cuenta/pedidos"
        className="flex w-fit items-center gap-1 font-body text-sm font-bold text-secondary hover:text-secondary"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a mis pedidos
      </Link>

      <div className="rounded-sm bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-display text-xl font-bold text-secondary">
              {p.shopify_order_number || `#${p.shopify_order_id}`}
            </p>
            <p className="font-body text-xs text-muted-foreground">
              {formatFecha(p.fecha_pago || p.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="rounded-full px-3 py-1 font-body text-[11px] font-bold"
              style={{ background: estado.bg, color: estado.color }}
            >
              {estado.texto}
            </span>
            <span className="font-display text-xl font-bold text-secondary">{formatPrecio(Number(p.total))}</span>
          </div>
        </div>
      </div>

      <div className="rounded-sm bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-body text-sm font-bold text-secondary">Productos</h2>
        <div className="flex flex-col gap-3">
          {productos.map((pr, i) => {
            const nombreProducto = pr.nombre || pr.name || "Producto";
            const imagen = resolverImagen(pr.producto_id, nombreProducto);
            return (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-soft-gray">
                  {imagen ? (
                    <Image src={imagen} alt={nombreProducto} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl">📦</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-sm font-bold text-secondary">
                    {nombreProducto}
                    {(pr.cantidad ?? 1) > 1 ? ` ×${pr.cantidad}` : ""}
                  </p>
                  <p className="font-body text-xs text-muted-foreground">{formatPrecio(Number(pr.precio ?? 0))}</p>
                </div>
              </div>
            );
          })}
        </div>

        {bandanasRegalo.map((bandana, i) => (
          <div key={`${bandana.slug}-${i}`} className="mt-3 flex items-center gap-3 rounded-lg bg-soft-gray p-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white">
              {bandana.imagen && (
                <Image
                  src={bandana.imagen}
                  alt={`Bandana ${bandana.nombre}`}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              )}
            </div>
            <p className="flex items-center gap-1.5 font-body text-sm text-secondary">
              <Gift className="h-4 w-4 shrink-0 text-secondary" strokeWidth={1.75} />
              Regalo: <strong>Bandana {bandana.nombre} — Talla {bandana.talla}</strong>
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-sm bg-white p-5 shadow-sm">
          <h2 className="mb-2 flex items-center gap-1.5 font-body text-sm font-bold text-secondary">
            <CreditCard className="h-4 w-4 shrink-0" strokeWidth={1.75} /> Método de pago
          </h2>
          <p className="font-body text-sm text-muted-foreground">
            {FORMA_PAGO_LABEL[p.forma_pago ?? ""] ?? "No especificado"}
          </p>
        </div>

        <div className="rounded-sm bg-white p-5 shadow-sm">
          <h2 className="mb-2 flex items-center gap-1.5 font-body text-sm font-bold text-secondary">
            <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.75} /> Dirección de envío
          </h2>
          <p className="font-body text-sm text-muted-foreground">
            {direccionTexto || (p.zona_envio ? `Zona: ${p.zona_envio}` : "Sin dirección registrada")}
          </p>
          {(metodoEnvioTexto || documentoTexto) && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-border/50 pt-2">
              {metodoEnvioTexto && (
                <p className="font-body text-xs text-muted-foreground">
                  <span className="font-bold text-secondary">Envío:</span> {metodoEnvioTexto}
                </p>
              )}
              {documentoTexto && (
                <p className="font-body text-xs text-muted-foreground">
                  <span className="font-bold text-secondary">Documento:</span> {documentoTexto}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {(!!p.puntos_acreditados || (p.fecha_agotamiento_estimada && p.estado === "entregado")) && (
        <div className="flex flex-wrap gap-4 rounded-sm bg-white p-5 shadow-sm">
          {!!p.puntos_acreditados && p.puntos_acreditados > 0 && (
            <span className="flex items-center gap-1 font-body text-xs font-bold text-secondary">
              <Star className="h-3.5 w-3.5" strokeWidth={1.75} />
              {p.puntos_acreditados} SuplePoints acreditados
            </span>
          )}
          {p.fecha_agotamiento_estimada && p.estado === "entregado" && (
            <span className="flex items-center gap-1 font-body text-xs font-bold text-accent-foreground">
              <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
              Reposición: {formatFecha(p.fecha_agotamiento_estimada)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
