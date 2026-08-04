"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Loader2, MapPin } from "lucide-react";
import type { Coordenadas } from "@/lib/ubicacion";

export interface DireccionElegida extends Coordenadas {
  direccion: string;
  distrito: string | null;
  provincia: string | null;
  departamento: string | null;
  codigoPostal: string | null;
}

interface Sugerencia {
  placeId: string;
  principal: string;
  secundario: string;
}

interface DireccionAutocompleteProps {
  value: string;
  onChange: (direccion: string) => void;
  onElegir: (elegida: DireccionElegida) => void;
  /** Ya hay coordenadas guardadas para la dirección escrita. */
  ubicada: boolean;
  /** El padre está resolviendo la dirección por su cuenta (pin del mapa). */
  cargandoExterno?: boolean;
  className?: string;
}

const MIN_CARACTERES = 4;
const DEBOUNCE_MS = 350;

export function DireccionAutocomplete({
  value,
  onChange,
  onElegir,
  ubicada,
  cargandoExterno = false,
  className,
}: DireccionAutocompleteProps) {
  const listboxId = useId();
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [resaltada, setResaltada] = useState(-1);
  const contenedorRef = useRef<HTMLDivElement>(null);

  // Google factura el autocompletado por SESIÓN: todas las teclas + el detalle
  // final cuentan como una sola si comparten este token. Se renueva recién
  // después de elegir una dirección, que es cuando la sesión se cierra.
  const sessionTokenRef = useRef(crypto.randomUUID());
  // Solo se busca cuando el texto lo tecleó la persona. Los cambios que
  // ponemos nosotros —la sugerencia elegida, la dirección que devuelve el pin
  // del mapa, los datos precargados del perfil— no deben disparar una búsqueda:
  // ya están resueltos y volver a consultarlos gasta cuota para reofrecerle lo
  // mismo que acaba de elegir. Antes esto era un flag de un solo uso que se
  // quedaba encendido si el texto elegido resultaba idéntico al que ya estaba
  // escrito, y en ese caso se comía la siguiente búsqueda de verdad.
  const usuarioEscribioRef = useRef(false);

  useEffect(() => {
    if (!usuarioEscribioRef.current) {
      setSugerencias([]);
      setAbierto(false);
      return;
    }
    if (value.trim().length < MIN_CARACTERES) {
      setSugerencias([]);
      return;
    }

    let cancelado = false;
    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await fetch("/api/direcciones/autocompletar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texto: value.trim(), sessionToken: sessionTokenRef.current }),
        });
        const d = await r.json().catch(() => null);
        if (cancelado) return;
        setSugerencias(d?.sugerencias ?? []);
        setAbierto((d?.sugerencias ?? []).length > 0);
        setResaltada(-1);
      } catch {
        if (!cancelado) setSugerencias([]);
      } finally {
        if (!cancelado) setBuscando(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    function alClickAfuera(e: MouseEvent) {
      if (!contenedorRef.current?.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", alClickAfuera);
    return () => document.removeEventListener("mousedown", alClickAfuera);
  }, []);

  async function elegir(sugerencia: Sugerencia) {
    setAbierto(false);
    setResaltada(-1);
    setCargandoDetalle(true);
    usuarioEscribioRef.current = false;
    try {
      const r = await fetch("/api/direcciones/detalle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: sugerencia.placeId, sessionToken: sessionTokenRef.current }),
      });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.ok) {
        onElegir({
          direccion: d.direccion,
          lat: d.lat,
          lng: d.lng,
          distrito: d.distrito,
          provincia: d.provincia,
          departamento: d.departamento,
          codigoPostal: d.codigoPostal ?? null,
        });
      } else {
        // Si el detalle falla, al menos queda escrito lo que eligió.
        onChange([sugerencia.principal, sugerencia.secundario].filter(Boolean).join(", "));
      }
    } finally {
      sessionTokenRef.current = crypto.randomUUID();
      setSugerencias([]);
      setCargandoDetalle(false);
    }
  }

  // Teclado: la lista tiene que poder recorrerse sin mouse. Sin esto, quien
  // navega con teclado (o con lector de pantalla) escribe la dirección, ve
  // aparecer las sugerencias y no tiene forma de llegar a ellas.
  function alTeclear(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setAbierto(false);
      setResaltada(-1);
      return;
    }
    if (!abierto || sugerencias.length === 0) {
      if (e.key === "ArrowDown" && sugerencias.length > 0) {
        e.preventDefault();
        setAbierto(true);
        setResaltada(0);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setResaltada((i) => (i + 1) % sugerencias.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setResaltada((i) => (i <= 0 ? sugerencias.length - 1 : i - 1));
    } else if (e.key === "Enter" && resaltada >= 0) {
      // Solo se intercepta el Enter cuando hay una sugerencia resaltada; si no,
      // se deja pasar para no bloquear el envío normal del formulario.
      e.preventDefault();
      elegir(sugerencias[resaltada]);
    }
  }

  const opcionId = (indice: number) => `${listboxId}-opcion-${indice}`;

  return (
    <div ref={contenedorRef} className="relative">
      <div className="relative">
        <input
          required
          type="text"
          role="combobox"
          aria-expanded={abierto}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={abierto && resaltada >= 0 ? opcionId(resaltada) : undefined}
          autoComplete="off"
          placeholder="Dirección"
          value={value}
          onChange={(e) => {
            usuarioEscribioRef.current = true;
            onChange(e.target.value);
          }}
          onKeyDown={alTeclear}
          onFocus={() => sugerencias.length > 0 && setAbierto(true)}
          className={`${className} w-full pr-10`}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {buscando || cargandoDetalle || cargandoExterno ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : ubicada ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </span>
      </div>

      {abierto && sugerencias.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-white shadow-lg"
        >
          {sugerencias.map((s, i) => (
            <li key={s.placeId} id={opcionId(i)} role="option" aria-selected={i === resaltada}>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => elegir(s)}
                onMouseEnter={() => setResaltada(i)}
                className={`flex w-full items-start gap-2 px-4 py-2.5 text-left hover:bg-soft-gray ${
                  i === resaltada ? "bg-soft-gray" : ""
                }`}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                <span className="min-w-0">
                  <span className="block truncate font-body text-sm text-secondary">{s.principal}</span>
                  {s.secundario && (
                    <span className="block truncate font-body text-xs text-muted-foreground">
                      {s.secundario}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-1 font-body text-xs text-muted-foreground">
        {ubicada
          ? "Ubicación exacta guardada — el repartidor llegará directo a tu puerta."
          : "Escribe y elige tu dirección de la lista para que el repartidor la ubique exacta."}
      </p>
    </div>
  );
}
