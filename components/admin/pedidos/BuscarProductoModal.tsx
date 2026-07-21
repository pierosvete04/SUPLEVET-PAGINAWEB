"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import { Modal } from "@/components/admin/Modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ItemPedido } from "@/lib/data/pedidos-admin";

interface ProductoBusqueda {
  id: string;
  slug: string;
  nombre: string;
  precio: number;
  imagen: string;
  sku: string | null;
  stock: number | null;
}

interface BuscarProductoModalProps {
  onAgregar: (item: ItemPedido) => void;
  onClose: () => void;
}

export function BuscarProductoModal({ onAgregar, onClose }: BuscarProductoModalProps) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ProductoBusqueda[]>([]);
  const [cargando, setCargando] = useState(false);
  const busquedaDebounced = useDebounce(busqueda, 300);

  useEffect(() => {
    let cancelado = false;
    async function buscar() {
      setCargando(true);
      let query = createClient()
        .from("productos_web")
        .select("id, slug, nombre, precio, imagen, sku, stock")
        .eq("activo", true)
        .order("nombre", { ascending: true })
        .limit(8);
      if (busquedaDebounced.trim()) {
        query = query.ilike("nombre", `%${busquedaDebounced.trim()}%`);
      }
      const { data } = await query;
      if (!cancelado) {
        setResultados((data as ProductoBusqueda[]) ?? []);
        setCargando(false);
      }
    }
    buscar();
    return () => {
      cancelado = true;
    };
  }, [busquedaDebounced]);

  function agregar(producto: ProductoBusqueda) {
    onAgregar({
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1,
      sku: producto.sku ?? producto.slug,
    });
    onClose();
  }

  return (
    <Modal titulo="Agregar producto" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Input
          autoFocus
          placeholder="Buscar producto por nombre…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {!cargando && resultados.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No se encontraron productos.</p>
          )}
          {resultados.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => agregar(p)}
              className="flex items-center gap-3 rounded-md p-2 text-left hover:bg-soft-gray"
            >
              <Avatar className="h-10 w-10 rounded-md">
                <AvatarImage src={p.imagen ?? undefined} alt="" className="object-cover" />
                <AvatarFallback className="rounded-md bg-soft-gray" />
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{p.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  S/.{p.precio.toFixed(2)} {p.stock !== null && `· Stock: ${p.stock}`}
                </p>
              </div>
              <Button type="button" size="sm" variant="ghost" tabIndex={-1}>
                Agregar
              </Button>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
