import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatFecha } from "@/lib/portal/formato";
import { formatPrecio } from "@/lib/data/productos-shared";
import { ESTADO_PEDIDO, type Pedido, type PedidoVet } from "@/lib/data/portal/pedidos";
import { estadoBadgePedido } from "@/lib/data/portal/pedido-timeline";
import { getProductos } from "@/lib/data/productos";
import { PedidoProductoDialog } from "@/components/portal/pedidos/PedidoProductoDialog";
import type { EstadoResena } from "@/lib/resenas";

interface ResenaExistente {
  estado: EstadoResena;
  calificacion: number;
  texto: string;
}

export default async function PortalPedidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: pedidos }, { data: pedidosVet }, { data: resenas }, catalogo] = await Promise.all([
    supabase
      .from("pedidos")
      .select(
        "id, shopify_order_number, shopify_order_id, estado, estado_pago, estado_preparacion, total, productos, puntos_acreditados, fecha_agotamiento_estimada, fecha_pago, created_at"
      )
      .eq("cliente_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("pedidos_vet")
      .select("id, veterinaria_nombre, monto_total, puntos_acreditados, estado, created_at")
      .eq("cliente_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("resenas")
      .select("pedido_id, producto_shopify_id, estado, calificacion, texto")
      .eq("cliente_id", user.id),
    getProductos(),
  ]);

  // Mapa pedido_id:producto_shopify_id -> reseña completa, para saber por
  // producto si ya se dejó reseña (y con qué contenido) sin tener que
  // consultarlo por cada línea de pedido.
  const resenaPorProducto = new Map<string, ResenaExistente>(
    (resenas ?? []).map((r) => [
      `${r.pedido_id}:${r.producto_shopify_id}`,
      { estado: r.estado as EstadoResena, calificacion: r.calificacion, texto: r.texto },
    ])
  );

  // Dos mapas para resolver la foto del producto comprado (el pedido en sí
  // solo guarda nombre/precio/cantidad/producto_id, no la foto): primero por
  // shopify_product_id (más confiable, así el nombre exacto de Shopify en la
  // línea del pedido no tenga que calzar con el nombre del catálogo), y como
  // respaldo por nombre en minúscula.
  const imagenPorShopifyId = new Map(
    catalogo.filter((p) => p.shopifyProductId).map((p) => [p.shopifyProductId as string, p.imagen])
  );
  const imagenPorNombre = new Map(catalogo.map((p) => [p.nombre.toLowerCase(), p.imagen]));

  function resolverImagen(productoShopifyId: string | null, nombre: string): string | null {
    if (productoShopifyId && imagenPorShopifyId.has(productoShopifyId)) {
      return imagenPorShopifyId.get(productoShopifyId) ?? null;
    }
    return imagenPorNombre.get(nombre.toLowerCase()) ?? null;
  }

  const todos = [
    ...((pedidos as Pedido[]) ?? []).map((p) => ({ ...p, canal: "tienda" as const })),
    ...((pedidosVet as PedidoVet[]) ?? []).map((p) => ({ ...p, canal: "veterinaria" as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-[18px] border border-portal-surface-variant bg-white p-10 text-center">
        <span className="material-symbols-rounded text-4xl text-portal-muted">shopping_bag</span>
        <p className="text-sm text-portal-muted">Aún no tienes pedidos</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {todos.map((p) => {
        if (p.canal === "tienda") {
          const estado = estadoBadgePedido(p);
          const productos = Array.isArray(p.productos) ? p.productos : [];
          return (
            <div
              key={p.id}
              className="relative rounded-[18px] border border-portal-surface-variant bg-white p-5 transition-all duration-200 hover:border-portal-teal-light hover:shadow-lg hover:shadow-portal-navy/10 active:shadow-md active:shadow-portal-navy/15"
            >
              <Link
                href={`/mi-cuenta/pedidos/${p.id}`}
                aria-label={`Ver detalle del pedido ${p.shopify_order_number || p.shopify_order_id}`}
                className="absolute inset-0 z-0"
              />
              <div className="pointer-events-none relative flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display text-base font-bold text-portal-navy">
                    {p.shopify_order_number || `#${p.shopify_order_id}`}
                  </p>
                  <p className="text-xs text-portal-muted">{formatFecha(p.fecha_pago || p.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="rounded-[10px] px-3 py-1 text-[11px] font-bold"
                    style={{ background: estado.bg, color: estado.color }}
                  >
                    {estado.texto}
                  </span>
                  <span className="font-display text-lg font-bold text-portal-navy">
                    {formatPrecio(Number(p.total))}
                  </span>
                </div>
              </div>
              {productos.length > 0 && (
                <div className="pointer-events-none relative mt-3 rounded-[12px] bg-portal-surface-low p-3">
                  {productos.slice(0, 3).map((pr, i) => {
                    const nombreProducto = pr.nombre || pr.name || "Producto";
                    const productoShopifyId = pr.producto_id ?? null;
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 border-b border-portal-surface-variant/70 py-2 last:border-0 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1 text-xs text-portal-muted">
                          <p className="truncate">
                            {nombreProducto}
                            {(pr.cantidad ?? 1) > 1 ? ` ×${pr.cantidad}` : ""}
                          </p>
                          <p className="font-bold text-portal-navy">{formatPrecio(Number(pr.precio ?? 0))}</p>
                        </div>
                        <PedidoProductoDialog
                          clienteId={user.id}
                          pedidoId={p.id}
                          pedidoNumero={p.shopify_order_number || `#${p.shopify_order_id}`}
                          pedidoFecha={p.fecha_pago || p.created_at}
                          pedidoEstado={estado}
                          productoShopifyId={productoShopifyId}
                          productoNombre={nombreProducto}
                          productoImagen={resolverImagen(productoShopifyId, nombreProducto)}
                          cantidad={pr.cantidad ?? 1}
                          precio={Number(pr.precio ?? 0)}
                          puedeResenar={p.estado_preparacion === "entregado"}
                          resenaExistente={
                            productoShopifyId
                              ? resenaPorProducto.get(`${p.id}:${productoShopifyId}`) ?? null
                              : null
                          }
                        />
                      </div>
                    );
                  })}
                  {productos.length > 3 && (
                    <p className="mt-1 text-[11px] text-portal-muted">+{productos.length - 3} productos más</p>
                  )}
                </div>
              )}
              <div className="pointer-events-none relative mt-3 flex flex-wrap gap-4">
                {!!p.puntos_acreditados && p.puntos_acreditados > 0 && (
                  <span className="flex items-center gap-1 text-xs font-bold text-portal-navy">
                    <span className="material-symbols-rounded text-[16px] text-portal-orange">star</span>
                    {p.puntos_acreditados} SuplePoints acreditados
                  </span>
                )}
              </div>
            </div>
          );
        }

        const estado = ESTADO_PEDIDO[p.estado] ?? ESTADO_PEDIDO.confirmado;
        return (
          <div key={p.id} className="rounded-[18px] border border-portal-surface-variant bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-display text-base font-bold text-portal-navy">{p.veterinaria_nombre}</p>
                <p className="text-xs text-portal-muted">{formatFecha(p.created_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="rounded-[10px] px-3 py-1 text-[11px] font-bold"
                  style={{ background: estado.bg, color: estado.color }}
                >
                  Compra en veterinaria
                </span>
                <span className="font-display text-lg font-bold text-portal-navy">
                  {formatPrecio(Number(p.monto_total))}
                </span>
              </div>
            </div>
            {!!p.puntos_acreditados && p.puntos_acreditados > 0 && (
              <span className="mt-2 flex items-center gap-1 text-xs font-bold text-portal-navy">
                <span className="material-symbols-rounded text-[16px] text-portal-orange">star</span>
                {p.puntos_acreditados} SuplePoints acreditados
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
