"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ClientePedidoSeleccionado {
  id: string | null;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
}

interface ClienteResultado {
  id: string;
  nombre: string | null;
  apellido: string | null;
  email: string;
  telefono: string | null;
}

interface ClienteSelectorProps {
  value: ClientePedidoSeleccionado | null;
  onChange: (cliente: ClientePedidoSeleccionado | null) => void;
}

export function ClienteSelector({ value, onChange }: ClienteSelectorProps) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ClienteResultado[]>([]);
  const [creandoNuevo, setCreandoNuevo] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: "", apellido: "", email: "", telefono: "" });
  const busquedaDebounced = useDebounce(busqueda, 300);

  useEffect(() => {
    let cancelado = false;
    async function buscar() {
      if (!busquedaDebounced.trim()) {
        setResultados([]);
        return;
      }
      const termino = busquedaDebounced.trim();
      const { data } = await createClient()
        .from("admin_clientes_resumen")
        .select("id, nombre, apellido, email, telefono")
        .or(`nombre.ilike.%${termino}%,apellido.ilike.%${termino}%,email.ilike.%${termino}%`)
        .limit(6);
      if (!cancelado) setResultados((data as ClienteResultado[]) ?? []);
    }
    buscar();
    return () => {
      cancelado = true;
    };
  }, [busquedaDebounced]);

  if (value) {
    return (
      <div className="flex items-start justify-between gap-2 rounded-md border p-3">
        <div>
          <p className="text-sm font-medium">{`${value.nombre} ${value.apellido}`.trim() || "Sin nombre"}</p>
          <p className="text-xs text-muted-foreground">{value.email}</p>
          {value.telefono && <p className="text-xs text-muted-foreground">{value.telefono}</p>}
          {!value.id && (
            <p className="mt-1 text-xs text-secondary">
              Se creará una cuenta nueva para este cliente al guardar el pedido
            </p>
          )}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
          <X className="h-4 w-4" /> Cambiar
        </Button>
      </div>
    );
  }

  if (creandoNuevo) {
    const puedeGuardar = nuevo.nombre.trim() && nuevo.email.trim();
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nuevo-nombre">Nombre *</Label>
          <Input
            id="nuevo-nombre"
            value={nuevo.nombre}
            onChange={(e) => setNuevo((n) => ({ ...n, nombre: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nuevo-apellido">Apellido</Label>
          <Input
            id="nuevo-apellido"
            value={nuevo.apellido}
            onChange={(e) => setNuevo((n) => ({ ...n, apellido: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nuevo-email">Email *</Label>
          <Input
            id="nuevo-email"
            type="email"
            value={nuevo.email}
            onChange={(e) => setNuevo((n) => ({ ...n, email: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nuevo-telefono">Teléfono</Label>
          <Input
            id="nuevo-telefono"
            value={nuevo.telefono}
            onChange={(e) => setNuevo((n) => ({ ...n, telefono: e.target.value }))}
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            disabled={!puedeGuardar}
            onClick={() =>
              onChange({
                id: null,
                nombre: nuevo.nombre.trim(),
                apellido: nuevo.apellido.trim(),
                email: nuevo.email.trim(),
                telefono: nuevo.telefono.trim() || null,
              })
            }
          >
            Guardar cliente
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setCreandoNuevo(false)}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Busca un cliente por nombre o email"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>
      {resultados.length > 0 && (
        <div className="flex flex-col gap-1">
          {resultados.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() =>
                onChange({
                  id: c.id,
                  nombre: c.nombre ?? "",
                  apellido: c.apellido ?? "",
                  email: c.email,
                  telefono: c.telefono,
                })
              }
              className="rounded-md p-2 text-left text-sm hover:bg-soft-gray"
            >
              <span className="font-medium">{`${c.nombre ?? ""} ${c.apellido ?? ""}`.trim() || "Sin nombre"}</span>
              <span className="ml-2 text-xs text-muted-foreground">{c.email}</span>
            </button>
          ))}
        </div>
      )}
      <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => setCreandoNuevo(true)}>
        + Crear cliente nuevo
      </Button>
    </div>
  );
}
