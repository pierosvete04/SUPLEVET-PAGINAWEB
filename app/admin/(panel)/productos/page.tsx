"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  MoreHorizontal,
  PackageSearch,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { revalidarSitioPublico } from "@/lib/revalidar-publico";
import { traducirErrorSupabase } from "@/lib/errores-supabase";
import { formatPrecio } from "@/lib/data/productos-shared";
import { Badge } from "@/components/admin/Badge";
import { SortableTableHead } from "@/components/admin/table/SortableTableHead";
import { TableCard } from "@/components/admin/table/TableCard";
import { TablePagination } from "@/components/admin/table/TablePagination";
import { useTableRows } from "@/components/admin/table/useTableRows";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconosMetodosPago } from "@/components/admin/productos/SelectorMetodosPago";
import { ProductoForm, type ProductoWeb } from "@/components/admin/productos/ProductoForm";
import { cn } from "@/lib/utils";

type FiltroEstado = "todos" | "activos" | "ocultos";

function valorOrden(p: ProductoWeb, columna: string) {
  switch (columna) {
    case "nombre":
      return p.nombre;
    case "estado":
      return p.activo ? 1 : 0;
    case "categoria":
      return p.categoria;
    case "precio":
      return p.precio;
    case "stock":
      return p.stock ?? -1;
    default:
      return null;
  }
}

/** Stock nulo = el admin no lleva control de ese producto, no "cero unidades". */
function etiquetaStock(stock: number | null) {
  if (stock === null) return { texto: "Sin control", color: "gris" as const };
  if (stock <= 0) return { texto: "Agotado", color: "rojo" as const };
  if (stock <= 5) return { texto: `${stock} · bajo`, color: "naranja" as const };
  return { texto: String(stock), color: "verde" as const };
}

export default function AdminProductosPage() {
  const [productos, setProductos] = useState<ProductoWeb[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<ProductoWeb | null>(null);
  const [creando, setCreando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<FiltroEstado>("todos");

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await createClient()
      .from("productos_web")
      .select("*")
      .order("orden", { ascending: true });
    setProductos((data as ProductoWeb[]) ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function cerrarFormulario() {
    setEditando(null);
    setCreando(false);
  }

  async function recargarYCerrar() {
    await cargar();
    cerrarFormulario();
  }

  async function alternarVisibilidad(p: ProductoWeb) {
    const { error } = await createClient()
      .from("productos_web")
      .update({ activo: !p.activo })
      .eq("id", p.id);
    if (error) {
      toast.error(traducirErrorSupabase(error));
      return;
    }
    setProductos((lista) =>
      lista.map((item) => (item.id === p.id ? { ...item, activo: !p.activo } : item))
    );
    await revalidarSitioPublico();
    toast.success(p.activo ? `"${p.nombre}" ya no se ve en la tienda.` : `"${p.nombre}" ya está visible.`);
  }

  async function duplicar(p: ProductoWeb) {
    const { id: _id, ...resto } = p;
    const copia = {
      ...resto,
      nombre: `${p.nombre} (copia)`,
      slug: `${p.slug}-copia`,
      activo: false,
      shopify_product_id: null,
    };
    const { error } = await createClient().from("productos_web").insert(copia);
    if (error) {
      toast.error(traducirErrorSupabase(error));
      return;
    }
    await cargar();
    toast.success("Copia creada, oculta en la tienda. Edítala y publícala cuando quieras.");
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter((p) => {
      if (filtro === "activos" && !p.activo) return false;
      if (filtro === "ocultos" && p.activo) return false;
      if (!q) return true;
      return (
        p.nombre.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q)
      );
    });
  }, [productos, busqueda, filtro]);

  const { pageRows, totalRows, page, totalPages, setPage, sortColumn, sortDirection, toggleSort } =
    useTableRows({ rows: filtrados, getSortValue: valorOrden });

  const conteos = useMemo(
    () => ({
      todos: productos.length,
      activos: productos.filter((p) => p.activo).length,
      ocultos: productos.filter((p) => !p.activo).length,
    }),
    [productos]
  );

  return (
    // min-w-0: sin esto el ancho natural de la tabla estira toda la página y
    // aparece scroll horizontal en el panel completo en vez de dentro de la tarjeta.
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Productos</h2>
          <p className="text-sm text-muted-foreground">
            Lo que ves acá es exactamente lo que se ofrece en la tienda.
          </p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" /> Agregar producto
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nombre, URL o SKU"
            aria-label="Buscar productos"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-full border bg-card p-1">
          {(
            [
              ["todos", "Todos"],
              ["activos", "Visibles"],
              ["ocultos", "Ocultos"],
            ] as const
          ).map(([valor, etiqueta]) => (
            <button
              key={valor}
              type="button"
              onClick={() => {
                setFiltro(valor);
                setPage(1);
              }}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                filtro === valor
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {etiqueta}
              <span className="ml-1.5 tabular-nums opacity-70">{conteos[valor]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* overflow-x-auto: la tabla scrollea dentro de la tarjeta en pantallas
          angostas, en vez de empujar el ancho de toda la página. */}
      <TableCard className="overflow-x-auto">
        <Table className="min-w-[880px]">
          <TableHeader>
            <TableRow>
              <SortableTableHead columnId="nombre" label="Producto" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} className="w-full max-w-1/4" />
              <SortableTableHead columnId="estado" label="Estado" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="categoria" label="Tipo" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="precio" label="Precio" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <SortableTableHead columnId="stock" label="Stock" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              <TableHead className="whitespace-nowrap">Formas de pago</TableHead>
              <TableHead className="px-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && totalRows === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <PackageSearch className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {productos.length === 0
                        ? "Todavía no tienes productos"
                        : "Ningún producto coincide con esa búsqueda"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {productos.length === 0
                        ? "Crea el primero y aparecerá en la tienda al instante."
                        : "Prueba con otro nombre o cambia el filtro."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((p) => {
              const stock = etiquetaStock(p.stock);
              const enOferta = p.precio_comparacion > p.precio;
              return (
                // La fila entera abre el editor con el mouse, pero NO lleva
                // role="button": eso anida botones (el toggle, el menú "⋯") dentro
                // de otro botón y los esconde del teclado y los lectores de
                // pantalla. El acceso accesible va por el nombre del producto.
                <TableRow
                  key={p.id}
                  onClick={() => setEditando(p)}
                  className={cn("cursor-pointer", !p.activo && "opacity-70")}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-md">
                        <AvatarImage src={p.imagen ?? undefined} alt="" className="object-cover" />
                        <AvatarFallback className="rounded-md bg-soft-gray" />
                      </Avatar>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditando(p);
                          }}
                          className="whitespace-nowrap rounded-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {p.nombre}
                          <span className="sr-only"> — abrir para editar</span>
                        </button>
                        <p className="truncate text-xs text-muted-foreground">
                          /{p.slug}
                          {p.sku ? ` · ${p.sku}` : ""}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        alternarVisibilidad(p);
                      }}
                      title={p.activo ? "Ocultar de la tienda" : "Mostrar en la tienda"}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-body text-xs font-bold transition-colors",
                        p.activo
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      )}
                    >
                      {p.activo ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {p.activo ? "Visible" : "Oculto"}
                    </button>
                  </TableCell>
                  <TableCell className="capitalize">{p.categoria}</TableCell>
                  <TableCell>
                    <span className="font-medium tabular-nums">{formatPrecio(p.precio)}</span>
                    {enOferta && (
                      <span className="ml-1.5 whitespace-nowrap text-xs text-muted-foreground line-through tabular-nums">
                        {formatPrecio(p.precio_comparacion)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge color={stock.color}>{stock.texto}</Badge>
                  </TableCell>
                  <TableCell>
                    <IconosMetodosPago metodos={p.metodos_pago_permitidos} />
                  </TableCell>
                  <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" aria-label={`Más acciones para ${p.nombre}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditando(p)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/productos/${p.slug}`} target="_blank">
                              <ExternalLink className="mr-2 h-4 w-4" /> Ver en la tienda
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicar(p)}>
                            <Copy className="mr-2 h-4 w-4" /> Duplicar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination page={page} totalPages={totalPages} totalRows={totalRows} onPageChange={setPage} />
      </TableCard>

      {(creando || editando) && (
        <ProductoForm producto={editando} onClose={cerrarFormulario} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
