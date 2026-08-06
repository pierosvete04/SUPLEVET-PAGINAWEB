"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ClientePedidoSeleccionado {
  /** null = todavía no tiene cuenta; se le crea al guardar el pedido. */
  id: string | null;
  email: string;
  /** Nombre mostrado en la tarjeta — para clientes nuevos lo llena el
   * formulario de entrega (con el DNI), no este selector. */
  nombre: string;
}

/** Datos del perfil del portal que se vuelcan al formulario de entrega. */
export interface PerfilCliente {
  nombre: string | null;
  apellido: string | null;
  telefono: string | null;
  direccion: string | null;
  distrito: string | null;
  provincia: string | null;
  /** "ciudad" guarda el departamento (nombre heredado). */
  ciudad: string | null;
  codigo_postal: string | null;
  lat: number | null;
  lng: number | null;
  tipo_documento: string | null;
  numero_documento: string | null;
}

interface ClienteResultado {
  id: string;
  nombre: string | null;
  apellido: string | null;
  email: string;
}

interface ClienteSelectorProps {
  value: ClientePedidoSeleccionado | null;
  onChange: (cliente: ClientePedidoSeleccionado | null) => void;
  /** Se dispara al elegir un cliente existente, con su perfil del portal, para
   * precargar el formulario de entrega igual que hace el checkout. */
  onPerfilCargado: (perfil: PerfilCliente) => void;
}

// A quién se le factura el pedido. Solo pide el correo: el resto de los datos
// (nombre, DNI, teléfono, dirección) se llenan abajo en el mismo formulario
// que ve el cliente en el checkout, para no tener dos sitios donde escribir lo
// mismo — y para que el nombre salga de RENIEC cuando hay DNI.
export function ClienteSelector({ value, onChange, onPerfilCargado }: ClienteSelectorProps) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ClienteResultado[]>([]);
  const [creandoNuevo, setCreandoNuevo] = useState(false);
  const [emailNuevo, setEmailNuevo] = useState("");
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
        .select("id, nombre, apellido, email")
        .or(`nombre.ilike.%${termino}%,apellido.ilike.%${termino}%,email.ilike.%${termino}%`)
        .limit(6);
      if (!cancelado) setResultados((data as ClienteResultado[]) ?? []);
    }
    buscar();
    return () => {
      cancelado = true;
    };
  }, [busquedaDebounced]);

  async function elegirExistente(cliente: ClienteResultado) {
    onChange({
      id: cliente.id,
      email: cliente.email,
      nombre: `${cliente.nombre ?? ""} ${cliente.apellido ?? ""}`.trim(),
    });
    const { data: perfil } = await createClient()
      .from("clientes_perfil")
      .select(
        "nombre, apellido, telefono, direccion, distrito, provincia, ciudad, codigo_postal, lat, lng, tipo_documento, numero_documento"
      )
      .eq("id", cliente.id)
      .maybeSingle();
    if (perfil) onPerfilCargado(perfil as PerfilCliente);
  }

  if (value) {
    return (
      <div className="flex items-start justify-between gap-2 rounded-md border p-3">
        <div>
          <p className="text-sm font-medium">{value.nombre || "Sin nombre"}</p>
          <p className="text-xs text-muted-foreground">{value.email}</p>
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
    const emailValido = /^\S+@\S+\.\S+$/.test(emailNuevo.trim());
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nuevo-email">Email *</Label>
          <Input
            id="nuevo-email"
            type="email"
            value={emailNuevo}
            onChange={(e) => setEmailNuevo(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Nombre, DNI, teléfono y dirección se completan abajo, en «Entrega y facturación».
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            disabled={!emailValido}
            onClick={() => onChange({ id: null, email: emailNuevo.trim(), nombre: "" })}
          >
            Usar este correo
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
              onClick={() => elegirExistente(c)}
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
