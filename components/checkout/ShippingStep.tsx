"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { provinciasPorDepartamento, distritosPorProvincia } from "@/lib/data/ubigeo";
import {
  departamentosCheckout,
  getZonasEnvioActivas,
  getDistritosEnvioActivos,
  encontrarZonaPorDepartamento,
  encontrarCostoDistrito,
  calcularCostoEnvio,
  tarifaDeMetodo,
  esDepartamentoProvincia,
  type EnvioZona,
  type EnvioDistrito,
  type MetodoEnvio,
} from "@/lib/shipping";
import { formatPrecio } from "@/lib/data/productos-shared";
import {
  consultarDocumento,
  esConsultable,
  largoEsperado,
  TIPOS_DOCUMENTO,
  type TipoDocumento,
} from "@/lib/documento";
import { tieneCoordenadas, type Coordenadas } from "@/lib/ubicacion";
import { ubicarDistrito } from "@/lib/ubigeo-match";
import {
  DireccionAutocomplete,
  type DireccionElegida,
} from "@/components/checkout/DireccionAutocomplete";
import { MapaUbicacion } from "@/components/checkout/MapaUbicacion";

// El tipo vive en lib/shipping.ts (lo usa también el cálculo de tarifas); se
// reexporta acá porque media docena de archivos ya lo importaban desde este
// componente.
export type { MetodoEnvio };

export interface DireccionEnvio {
  nombre: string;
  apellidos: string;
  tipoDocumento: TipoDocumento | "";
  numeroDocumento: string;
  direccion: string;
  direccionSecundaria: string;
  departamento: string;
  provincia: string;
  distrito: string;
  codigoPostal: string;
  telefono: string;
  metodoEnvio: MetodoEnvio | "";
  /** Coordenadas de Google Places; null si escribió la dirección a mano. */
  lat: number | null;
  lng: number | null;
}

export const direccionVacia: DireccionEnvio = {
  nombre: "",
  apellidos: "",
  tipoDocumento: "dni",
  numeroDocumento: "",
  direccion: "",
  direccionSecundaria: "",
  departamento: "",
  provincia: "",
  distrito: "",
  codigoPostal: "",
  telefono: "",
  metodoEnvio: "",
  lat: null,
  lng: null,
};

/** Lo que Google sabe de un punto, sin las coordenadas (que ya conoce quien llama). */
type UbicacionDeMaps = Omit<DireccionElegida, "lat" | "lng">;

// Aplica a la dirección del formulario lo que Google resolvió para un punto:
// el texto, el código postal y —si el distrito se identifica sin ambigüedad,
// usando la provincia de Google para desempatar nombres repetidos— los 3
// dropdowns de ubigeo. Si queda ambiguo se dejan como estaban: la zona define
// el precio del envío, así que autocompletarla mal le cobraría de más (o de
// menos) al cliente.
//
// Es una función pura y fuera del componente a propósito: la usan tanto el
// buscador de direcciones como el arrastre del pin, y así ambos caminos dejan
// el formulario exactamente en el mismo estado.
function conUbicacionDeMaps(base: DireccionEnvio, ubicacion: UbicacionDeMaps): DireccionEnvio {
  const ubigeo = ubicarDistrito(ubicacion.distrito, ubicacion.provincia);
  return {
    ...base,
    direccion: ubicacion.direccion,
    // Se pisa siempre (incluso con "") — un código postal de la dirección
    // anterior es peor que el campo vacío, porque viaja al rótulo del courier.
    codigoPostal: ubicacion.codigoPostal ?? "",
    ...(ubigeo
      ? {
          departamento: ubigeo.departamento,
          provincia: ubigeo.provincia,
          distrito: ubigeo.distrito,
        }
      : {}),
  };
}

interface ShippingStepProps {
  subtotal: number;
  value: DireccionEnvio;
  onChange: (direccion: DireccionEnvio) => void;
  onZonaChange: (zona: EnvioZona | undefined, costoEnvio: number | null) => void;
  /** "cliente": el checkout público. "admin": el mismo formulario cargado por
   * el equipo en /admin/pedidos/nuevo con los datos que el cliente mandó por
   * interno — cambian los textos, no los campos ni las reglas. */
  contexto?: "cliente" | "admin";
}

const inputClass =
  "rounded-md border border-border px-4 py-3 font-body text-sm text-secondary placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed";

// El pin ya quedó guardado aunque el texto no se pueda resolver: lo que el
// courier abre en su celular son las coordenadas, así que el mensaje aclara que
// no perdió la ubicación.
const ERROR_PIN =
  "No pudimos leer la dirección de ese punto — la ubicación del pin sí quedó guardada. Revisa el distrito antes de continuar.";

// En el panel quien escribe la dirección no es el comprador, y lo que importa
// ahí es que queden las coordenadas para pasárselas al courier.
const NOTA_DIRECCION_ADMIN = {
  ubicada: "Ubicación exacta guardada — ya puedes copiar el punto para el courier.",
  sinUbicar: "Elige la dirección de la lista de Google para que el pedido quede con coordenadas.",
};

const metodosEnvio: { value: MetodoEnvio; nombre: string; descripcion: string }[] = [
  { value: "motorizado", nombre: "Delivery motorizado", descripcion: "Entrega directa en tu domicilio." },
  { value: "shalom", nombre: "Agencia Shalom", descripcion: "Envío y recojo en la agencia Shalom más cercana." },
];

// Renderiza dirección + método de envío como secciones de un único formulario
// continuo (no un "paso" aparte) — así el checkout completo vive en una sola
// página, igual al patrón de Shopify que pediste en vez del wizard por pasos.
export function ShippingStep({
  subtotal,
  value,
  onChange,
  onZonaChange,
  contexto = "cliente",
}: ShippingStepProps) {
  const esAdmin = contexto === "admin";
  const [zonas, setZonas] = useState<EnvioZona[]>([]);
  const [costosDistrito, setCostosDistrito] = useState<EnvioDistrito[]>([]);
  const [consultandoDoc, setConsultandoDoc] = useState(false);
  const [errorDoc, setErrorDoc] = useState<string | null>(null);
  const [docAutocompletado, setDocAutocompletado] = useState(false);
  const [resolviendoPin, setResolviendoPin] = useState(false);
  const [errorPin, setErrorPin] = useState<string | null>(null);
  // Cada arrastre incrementa el contador; solo la respuesta del arrastre más
  // reciente tiene derecho a escribir en el formulario.
  const solicitudPinRef = useRef(0);
  // La dirección se resuelve de forma asíncrona, así que al volver del fetch el
  // `value` del closure ya puede estar viejo (la persona siguió llenando el
  // formulario mientras tanto). El ref siempre apunta a lo último.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const supabase = createClient();
    getZonasEnvioActivas(supabase).then(setZonas);
    getDistritosEnvioActivos(supabase).then(setCostosDistrito);
  }, []);

  // Ciudad = provincia (dropdown siempre, con datos reales de RENIEC para los
  // 26 departamentos/zonas — antes solo Lima Metropolitana/Callao tenían
  // dropdown real y el resto era un input de texto deshabilitado hasta elegir
  // región, lo cual confundía el orden: ahora Región siempre va primero y
  // Ciudad/Distrito dependen de ella, pero los 3 son siempre <select>.
  const provincias = provinciasPorDepartamento[value.departamento] ?? [];
  const distritos = value.provincia
    ? distritosPorProvincia[`${value.departamento}::${value.provincia}`] ?? []
    : [];

  const zona = value.departamento ? encontrarZonaPorDepartamento(zonas, value.departamento) : undefined;
  const esProvincia = esDepartamentoProvincia(value.departamento);
  const costoDistrito = encontrarCostoDistrito(costosDistrito, zona, value.distrito);

  // Fuera de Lima Metropolitana/Callao el delivery motorizado no llega: solo
  // Agencia Shalom. Dentro de Lima/Callao se ofrecen los DOS, porque no compiten
  // en lo mismo — el motorizado llega a la puerta en 24–48 h pero cuesta según
  // el distrito, y Shalom sale más barato y parejo a cambio de más días y de
  // que la persona recoja en agencia. Que elija.
  const metodosDisponibles = esProvincia
    ? metodosEnvio.filter((m) => m.value === "shalom")
    : metodosEnvio;

  // El costo depende del método elegido, así que hasta que la persona no elige
  // uno no hay un total de envío que mostrar (y `puedeConfirmar` en el checkout
  // ya exige ambas cosas). Costo y tiempo siempre salen de envio_zonas /
  // envio_distritos, 100% administrable desde /admin/envios — antes las zonas
  // de provincia pisaban lo configurado con un flat rate hardcodeado
  // (COSTO_SHALOM_PROVINCIA) y editar la tarifa en el admin no tenía efecto.
  const metodoElegido = value.metodoEnvio || null;
  const costoEnvio =
    !zona || !metodoElegido
      ? null
      : calcularCostoEnvio(zona, subtotal, costoDistrito, metodoElegido);

  useEffect(() => {
    onZonaChange(zona, costoEnvio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zona?.id, costoEnvio]);

  // Si el método ya elegido deja de estar disponible (ej. tenía motorizado
  // seleccionado en Lima y cambia a un departamento de provincia), hay que
  // pedirle que elija de nuevo en vez de dejar seleccionada una opción que ya
  // no aplica.
  useEffect(() => {
    if (value.metodoEnvio && !metodosDisponibles.some((m) => m.value === value.metodoEnvio)) {
      set("metodoEnvio", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esProvincia]);

  function set<K extends keyof DireccionEnvio>(campo: K, valor: DireccionEnvio[K]) {
    onChange({ ...value, [campo]: valor });
  }

  function setDepartamento(nuevoDepartamento: string) {
    const nuevasProvincias = provinciasPorDepartamento[nuevoDepartamento] ?? [];
    // Si solo hay una provincia real (caso Lima Metropolitana / Callao), se
    // autoselecciona para no pedirle un clic de más a la persona.
    const provinciaAuto = nuevasProvincias.length === 1 ? nuevasProvincias[0] : "";
    onChange({ ...value, departamento: nuevoDepartamento, provincia: provinciaAuto, distrito: "" });
  }

  function setProvincia(nuevaProvincia: string) {
    onChange({ ...value, provincia: nuevaProvincia, distrito: "" });
  }

  const docLargo = largoEsperado(value.tipoDocumento);
  const puedeConsultarDoc =
    esConsultable(value.tipoDocumento) && value.numeroDocumento.length === docLargo;

  // Autocompleta nombre y apellidos desde RENIEC/SUNAT. Si la consulta falla
  // (sin token, documento inexistente, sin red) no bloquea nada: el cliente
  // escribe sus datos a mano igual que antes.
  async function consultar() {
    if (!puedeConsultarDoc || consultandoDoc) return;
    setConsultandoDoc(true);
    setErrorDoc(null);
    const { datos, error } = await consultarDocumento(
      value.tipoDocumento as "dni" | "ruc",
      value.numeroDocumento
    );
    if (datos) {
      onChange({ ...value, nombre: datos.nombre, apellidos: datos.apellidos });
      setDocAutocompletado(true);
    } else {
      setErrorDoc(error);
      setDocAutocompletado(false);
    }
    setConsultandoDoc(false);
  }

  function setNumeroDocumento(numero: string) {
    const limpio = value.tipoDocumento === "pasaporte" ? numero : numero.replace(/\D/g, "");
    setErrorDoc(null);
    setDocAutocompletado(false);
    set("numeroDocumento", docLargo ? limpio.slice(0, docLargo) : limpio.slice(0, 20));
  }

  // Al elegir una sugerencia de Google se guardan las coordenadas y se
  // completa el resto de la dirección con lo que Google sabe del lugar.
  function elegirDireccionDeMaps({ lat, lng, ...ubicacion }: DireccionElegida) {
    setErrorPin(null);
    onChange({ ...conUbicacionDeMaps(value, ubicacion), lat, lng });
  }

  // Arrastrar el pin es el otro camino para fijar la entrega, y tiene que
  // dejar el formulario igual de completo que el buscador: las coordenadas se
  // aplican al instante (ya son las buenas para el courier) y la dirección de
  // texto, el distrito y el código postal se reescriben con lo que Google
  // reporta para ese punto exacto.
  async function moverPin(coords: Coordenadas) {
    onChange({ ...value, lat: coords.lat, lng: coords.lng });

    const solicitud = ++solicitudPinRef.current;
    setResolviendoPin(true);
    setErrorPin(null);
    try {
      const r = await fetch("/api/direcciones/inversa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coords),
      });
      const d = await r.json().catch(() => null);
      // Si arrastró el pin otra vez mientras esperábamos, esta respuesta ya
      // describe un punto viejo y escribirla pisaría la ubicación más reciente.
      if (solicitud !== solicitudPinRef.current) return;

      if (r.ok && d?.ok) {
        onChange(
          conUbicacionDeMaps(valueRef.current, {
            direccion: d.direccion,
            distrito: d.distrito,
            provincia: d.provincia,
            departamento: d.departamento,
            codigoPostal: d.codigoPostal ?? null,
          })
        );
      } else {
        setErrorPin(ERROR_PIN);
      }
    } catch {
      if (solicitud === solicitudPinRef.current) setErrorPin(ERROR_PIN);
    } finally {
      if (solicitud === solicitudPinRef.current) setResolviendoPin(false);
    }
  }

  function setTipoDocumento(tipo: TipoDocumento) {
    setErrorDoc(null);
    setDocAutocompletado(false);
    onChange({ ...value, tipoDocumento: tipo, numeroDocumento: "" });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-secondary">Entrega y facturación</h2>
          <p className="font-body text-xs text-muted-foreground">
            {esAdmin
              ? "Los mismos datos que llena el cliente en el checkout — complétalos con lo que te mandó por interno."
              : "Ya tenemos tu cuenta registrada — confirma o ajusta estos datos para tu envío y comprobante."}
          </p>
        </div>

        <select disabled className={`${inputClass} bg-soft-gray text-muted-foreground`} defaultValue="Perú">
          <option>Perú</option>
        </select>

        {/* Documento opcional: ayuda al courier a validar identidad en la
            entrega y, si es DNI/RUC, autocompleta el nombre para que el
            rótulo salga exactamente como figura en RENIEC. */}
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,11rem)_1fr]">
            <select
              value={value.tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}
              className={inputClass}
            >
              {TIPOS_DOCUMENTO.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                type="text"
                inputMode={value.tipoDocumento === "pasaporte" ? "text" : "numeric"}
                placeholder={`N° de documento (opcional)`}
                value={value.numeroDocumento}
                onChange={(e) => setNumeroDocumento(e.target.value)}
                className={`${inputClass} min-w-0 flex-1`}
              />
              {esConsultable(value.tipoDocumento) && (
                <button
                  type="button"
                  onClick={consultar}
                  disabled={!puedeConsultarDoc || consultandoDoc}
                  className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 font-body text-xs font-bold text-secondary transition-opacity hover:bg-soft-gray disabled:opacity-40"
                >
                  {consultandoDoc ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Search className="h-3.5 w-3.5" />
                  )}
                  Buscar
                </button>
              )}
            </div>
          </div>

          {errorDoc ? (
            <p className="font-body text-xs text-destructive">{errorDoc}</p>
          ) : docAutocompletado ? (
            <p className="flex items-center gap-1 font-body text-xs text-green-700">
              <Check className="h-3.5 w-3.5" /> Datos encontrados y completados abajo.
            </p>
          ) : (
            <p className="font-body text-xs text-muted-foreground">
              {esAdmin
                ? "Con el DNI/RUC del cliente se completan nombre y apellidos desde RENIEC/SUNAT, tal cual saldrán en el rótulo."
                : "Opcional, pero lo recomendamos: con tu documento el courier puede verificar tu identidad al entregarte el pedido."}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input
            required
            type="text"
            placeholder="Nombre"
            value={value.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            className={inputClass}
          />
          <input
            required
            type="text"
            placeholder="Apellidos"
            value={value.apellidos}
            onChange={(e) => set("apellidos", e.target.value)}
            className={inputClass}
          />
        </div>

        <DireccionAutocomplete
          value={value.direccion}
          ubicada={tieneCoordenadas(value)}
          cargandoExterno={resolviendoPin}
          className={inputClass}
          nota={esAdmin ? NOTA_DIRECCION_ADMIN : undefined}
          // Escribir a mano invalida las coordenadas anteriores: si no, el
          // courier recibiría el pin de una dirección que ya no es la del pedido.
          onChange={(direccion) => {
            setErrorPin(null);
            onChange({ ...value, direccion, lat: null, lng: null });
          }}
          onElegir={elegirDireccionDeMaps}
        />

        {value.lat !== null && value.lng !== null && (
          <div className="flex flex-col gap-1.5">
            <MapaUbicacion
              lat={value.lat}
              lng={value.lng}
              resolviendo={resolviendoPin}
              onMover={moverPin}
            />
            {errorPin && <p className="font-body text-xs text-destructive">{errorPin}</p>}
          </div>
        )}

        <input
          type="text"
          placeholder="Casa, apartamento, etc. (opcional)"
          value={value.direccionSecundaria}
          onChange={(e) => set("direccionSecundaria", e.target.value)}
          className={inputClass}
        />

        {/* Orden lógico: Región primero (de ella depende Ciudad), luego Ciudad
            (de ella depende Distrito), luego Distrito, y por último el código
            postal opcional. Los 3 primeros son SIEMPRE listas desplegables. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <select
            required
            value={value.departamento}
            onChange={(e) => setDepartamento(e.target.value)}
            className={inputClass}
          >
            <option value="">Región</option>
            {departamentosCheckout.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            required
            value={value.provincia}
            disabled={provincias.length === 0}
            onChange={(e) => setProvincia(e.target.value)}
            className={inputClass}
          >
            <option value="">Ciudad</option>
            {provincias.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            required
            value={value.distrito}
            disabled={distritos.length === 0}
            onChange={(e) => set("distrito", e.target.value)}
            className={inputClass}
          >
            <option value="">Distrito</option>
            {distritos.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Código postal (opcional)"
            value={value.codigoPostal}
            onChange={(e) => set("codigoPostal", e.target.value)}
            className={inputClass}
          />
        </div>

        <input
          required
          type="tel"
          placeholder="Celular"
          value={value.telefono}
          onChange={(e) => set("telefono", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold text-secondary">Métodos de envío</h2>
        {!value.departamento ? (
          <p className="rounded-md bg-soft-gray p-4 font-body text-sm text-muted-foreground">
            Completa tu región para ver las opciones de envío.
          </p>
        ) : zona ? (
          <div className="flex flex-col gap-2">
            {metodosDisponibles.map((metodo) => {
              const seleccionado = value.metodoEnvio === metodo.value;
              // Cada opción muestra SU tarifa y SU plazo: son distintos entre
              // motorizado y Shalom, y verlos lado a lado es justamente lo que
              // permite decidir entre pagar menos o recibir antes.
              const { costo, tiempo } = tarifaDeMetodo(
                zona,
                subtotal,
                costoDistrito,
                metodo.value
              );
              return (
                <button
                  key={metodo.value}
                  type="button"
                  onClick={() => set("metodoEnvio", metodo.value)}
                  className={`flex items-center justify-between gap-3 rounded-md border-2 p-4 text-left transition-colors ${
                    seleccionado ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        seleccionado ? "border-primary bg-primary" : "border-border"
                      }`}
                    >
                      {seleccionado && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
                    </span>
                    <div>
                      <p className="font-body text-sm font-bold text-secondary">
                        {metodo.nombre} — {tiempo}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">{metodo.descripcion}</p>
                    </div>
                  </div>
                  <span className="shrink-0 font-body text-sm font-bold text-secondary">
                    {costo === 0 ? "GRATIS" : formatPrecio(costo)}
                  </span>
                </button>
              );
            })}
            <p className="font-body text-xs text-muted-foreground">
              Recuerda: compras mayores a {formatPrecio(zona.monto_minimo_gratis)} tienen delivery GRATIS.
            </p>
          </div>
        ) : (
          <p className="rounded-md bg-soft-gray p-4 font-body text-sm text-muted-foreground">
            No tenemos tarifa de envío configurada para esta región todavía.
          </p>
        )}
      </div>
    </div>
  );
}
