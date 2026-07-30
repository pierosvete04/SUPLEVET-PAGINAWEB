import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatFecha } from "@/lib/portal/formato";
import { formatPrecio } from "@/lib/data/productos-shared";
import { construirTimeline, estadoBadgePedido, type PedidoHistorialRow } from "@/lib/data/portal/pedido-timeline";
import { getProductos } from "@/lib/data/productos";
import { getVariantesPorSlugs } from "@/lib/regalo-variantes";
import { etiquetaCorta } from "@/lib/documento";
import { nombreCourier } from "@/lib/couriers";

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
  estado_preparacion: string;
  forma_pago: string | null;
  total: number;
  productos: ProductoPedidoDetalle[];
  puntos_acreditados: number | null;
  fecha_agotamiento_estimada: string | null;
  fecha_pago: string | null;
  fecha_entrega: string | null;
  direccion_envio: DireccionEnvio | null;
  zona_envio: string | null;
  regalo_bandana: string | null;
  regalo_bandanas: { slug: string; talla: string | null }[] | null;
  courier: string | null;
  courier_otro: string | null;
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
// dirección de envío usada, el timeline de estados (pedido_historial) y el
// regalo ganado (si aplica). Solo pedidos del canal "tienda" tienen esta
// información estructurada (los de veterinaria viven en otra tabla sin estos
// campos), por eso el listado solo enlaza acá para ese canal.
export default async function PortalPedidoDetalleRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: pedido }, { data: historial }, catalogo] = await Promise.all([
    supabase
      .from("pedidos")
      .select(
        "id, shopify_order_number, shopify_order_id, estado, estado_pago, estado_preparacion, forma_pago, total, productos, puntos_acreditados, fecha_agotamiento_estimada, fecha_pago, fecha_entrega, direccion_envio, zona_envio, regalo_bandana, regalo_bandanas, courier, courier_otro, created_at"
      )
      .eq("id", id)
      .eq("cliente_id", user.id)
      .maybeSingle(),
    supabase
      .from("pedido_historial")
      .select("estado, created_at")
      .eq("pedido_id", id)
      .order("created_at", { ascending: true }),
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

  const badge = estadoBadgePedido(p);
  const timeline = construirTimeline(p, (historial as PedidoHistorialRow[]) ?? []);
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
  const entregaPorTexto = nombreCourier(p.courier, p.courier_otro) ?? metodoEnvioTexto;
  const enCurso = !["entregado", "devuelto"].includes(p.estado_preparacion) && p.estado_pago === "pagado";

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/mi-cuenta/pedidos"
        className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-portal-navy hover:text-portal-teal-mid"
      >
        <span className="material-symbols-rounded text-[18px]">arrow_back</span>
        Mis Pedidos
      </Link>

      <div className="rounded-[18px] border border-portal-surface-variant bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-2xl font-bold text-portal-navy">
              {p.shopify_order_number || `#${p.shopify_order_id}`}
            </p>
            <p className="text-xs text-portal-muted">{formatFecha(p.fecha_pago || p.created_at)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="rounded-full px-3 py-1 text-[11px] font-bold"
              style={{ background: badge.bg, color: badge.color }}
            >
              {badge.texto}
            </span>
            <span className="font-display text-xl font-bold text-portal-navy">{formatPrecio(Number(p.total))}</span>
          </div>
        </div>

        {enCurso && entregaPorTexto && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-portal-surface-low p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-portal-teal-light/40">
              <span className="material-symbols-rounded text-portal-teal">local_shipping</span>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-portal-muted">Entrega por</p>
              <p className="truncate text-sm font-semibold text-portal-navy">{entregaPorTexto}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="rounded-[18px] border border-portal-surface-variant bg-white p-6">
            <h2 className="mb-3 font-display text-lg font-semibold text-portal-navy">Productos</h2>
            <div className="flex flex-col gap-3">
              {productos.map((pr, i) => {
                const nombreProducto = pr.nombre || pr.name || "Producto";
                const imagen = resolverImagen(pr.producto_id, nombreProducto);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 border-b border-portal-surface-variant/70 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-portal-surface-low">
                      {imagen ? (
                        <Image src={imagen} alt={nombreProducto} fill className="object-cover" sizes="56px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-portal-muted">
                          <span className="material-symbols-rounded">inventory_2</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-portal-navy">
                        {nombreProducto}
                        {(pr.cantidad ?? 1) > 1 ? ` ×${pr.cantidad}` : ""}
                      </p>
                      <p className="text-xs text-portal-muted">{formatPrecio(Number(pr.precio ?? 0))}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {bandanasRegalo.map((bandana, i) => (
              <div key={`${bandana.slug}-${i}`} className="mt-3 flex items-center gap-3 rounded-xl bg-portal-surface-low p-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white">
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
                <p className="flex items-center gap-1.5 text-sm text-portal-navy">
                  <span className="material-symbols-rounded text-[18px] text-portal-orange">redeem</span>
                  Regalo: <strong>Bandana {bandana.nombre} — Talla {bandana.talla}</strong>
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-[18px] border border-portal-surface-variant bg-white p-6">
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-portal-navy">
                <span className="material-symbols-rounded text-[18px]">credit_card</span> Método de pago
              </h2>
              <p className="text-sm text-portal-muted">{FORMA_PAGO_LABEL[p.forma_pago ?? ""] ?? "No especificado"}</p>
            </div>

            <div className="rounded-[18px] border border-portal-surface-variant bg-white p-6">
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-portal-navy">
                <span className="material-symbols-rounded text-[18px]">location_on</span> Dirección de envío
              </h2>
              <p className="text-sm text-portal-muted">
                {direccionTexto || (p.zona_envio ? `Zona: ${p.zona_envio}` : "Sin dirección registrada")}
              </p>
              {(metodoEnvioTexto || documentoTexto) && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-portal-surface-variant/70 pt-2">
                  {metodoEnvioTexto && (
                    <p className="text-xs text-portal-muted">
                      <span className="font-bold text-portal-navy">Envío:</span> {metodoEnvioTexto}
                    </p>
                  )}
                  {documentoTexto && (
                    <p className="text-xs text-portal-muted">
                      <span className="font-bold text-portal-navy">Documento:</span> {documentoTexto}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {(!!p.puntos_acreditados || (p.fecha_agotamiento_estimada && p.estado_preparacion === "entregado")) && (
            <div className="flex flex-wrap gap-4 rounded-[18px] border border-portal-surface-variant bg-white p-6">
              {!!p.puntos_acreditados && p.puntos_acreditados > 0 && (
                <span className="flex items-center gap-1 text-xs font-bold text-portal-navy">
                  <span className="material-symbols-rounded text-[16px] text-portal-orange">star</span>
                  {p.puntos_acreditados} SuplePoints acreditados
                </span>
              )}
              {p.fecha_agotamiento_estimada && p.estado_preparacion === "entregado" && (
                <span className="flex items-center gap-1 text-xs font-bold text-portal-teal">
                  <span className="material-symbols-rounded text-[16px]">schedule</span>
                  Reposición: {formatFecha(p.fecha_agotamiento_estimada)}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="rounded-[18px] border border-portal-surface-variant bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-portal-navy">Historial del pedido</h2>
          <div className="flex flex-col">
            {timeline.map((paso, i) => (
              <div key={paso.key} className="relative flex gap-3 pb-6 last:pb-0">
                {i < timeline.length - 1 && (
                  <span
                    className={`absolute left-[11px] top-6 h-full w-0.5 ${
                      paso.completado && timeline[i + 1]?.completado ? "bg-portal-teal" : "bg-portal-surface-variant"
                    }`}
                  />
                )}
                <span
                  className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    paso.completado
                      ? "bg-portal-teal text-white"
                      : "border-2 border-portal-surface-variant bg-white text-transparent"
                  }`}
                >
                  <span className="material-symbols-rounded text-[16px]">check</span>
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className={`text-sm font-semibold ${paso.completado ? "text-portal-navy" : "text-portal-muted"}`}>
                    {paso.label}
                  </p>
                  {paso.fecha && <p className="text-xs text-portal-muted">{formatFecha(paso.fecha)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
