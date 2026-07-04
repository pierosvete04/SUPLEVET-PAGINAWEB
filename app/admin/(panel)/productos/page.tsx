"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { ProductoForm, type ProductoWeb } from "@/components/admin/productos/ProductoForm";

export default function AdminProductosPage() {
  const [productos, setProductos] = useState<ProductoWeb[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<ProductoWeb | null>(null);
  const [creando, setCreando] = useState(false);

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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-body text-xl font-bold text-secondary">Productos</h1>
        <button
          onClick={() => setCreando(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-body text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Agregar producto
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <table className="w-full font-body text-sm">
          <thead className="bg-soft-gray text-left text-xs font-bold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {!cargando && productos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Sin productos todavía.
                </td>
              </tr>
            )}
            {productos.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="flex items-center gap-3 px-4 py-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-soft-gray">
                    {p.imagen && <Image src={p.imagen} alt="" fill className="object-cover" sizes="40px" />}
                  </div>
                  <span className="font-bold text-secondary">{p.nombre}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge color={p.activo ? "verde" : "gris"}>{p.activo ? "Activo" : "Inactivo"}</Badge>
                </td>
                <td className="px-4 py-3 capitalize text-secondary">{p.categoria}</td>
                <td className="px-4 py-3 text-secondary">S/.{p.precio.toFixed(2)}</td>
                <td className="px-4 py-3 text-secondary">{p.stock ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">SUPLEVET</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditando(p)}
                    className="font-body text-sm font-bold text-primary hover:underline"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(creando || editando) && (
        <ProductoForm producto={editando} onClose={cerrarFormulario} onSaved={recargarYCerrar} />
      )}
    </div>
  );
}
