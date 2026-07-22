"use client";

import { useEffect, useState } from "react";
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
  esDepartamentoProvincia,
  type EnvioZona,
  type EnvioDistrito,
} from "@/lib/shipping";
import { formatPrecio } from "@/lib/data/productos-shared";
import {
  consultarDocumento,
  esConsultable,
  largoEsperado,
  TIPOS_DOCUMENTO,
  type TipoDocumento,
} from "@/lib/documento";
import { tieneCoordenadas } from "@/lib/ubicacion";
import { ubicarDistrito } from "@/lib/ubigeo-match";
import {
  DireccionAutocomplete,
  type DireccionElegida,
} from "@/components/checkout/DireccionAutocomplete";
import { MapaUbicacion } from "@/components/checkout/MapaUbicacion";

export type MetodoEnvio = "motorizado" | "shalom";

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

interface ShippingStepProps {
  subtotal: number;
  value: DireccionEnvio;
  onChange: (direccion: DireccionEnvio) => void;
  onZonaChange: (zona: EnvioZona | undefined, costoEnvio: number | null) => void;
}

const inputClass =
  "rounded-md border border-border px-4 py-3 font-body text-sm text-secondary placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed";

const metodosEnvio: { value: MetodoEnvio; nombre: string; descripcion: string }[] = [
  { value: "motorizado", nombre: "Delivery motorizado", descripcion: "Entrega directa en tu domicilio." },
  { value: "shalom", nombre: "Agencia Shalom", descripcion: "Envío y recojo en la agencia Shalom más cercana." },
];

// Renderiza dirección + método de envío como secciones de un único formulario
// continuo (no un "paso" aparte) — así el checkout completo vive en una sola
// página, igual al patrón de Shopify que pediste en vez del wizard por pasos.
export function ShippingStep({ subtotal, value, onChange, onZonaChange }: ShippingStepProps) {
  const [zonas, setZonas] = useState<EnvioZona[]>([]);
  const [costosDistrito, setCostosDistrito] = useState<EnvioDistrito[]>([]);
  const [consultandoDoc, setConsultandoDoc] = useState(false);
  const [errorDoc, setErrorDoc] = useState<string | null>(null);
  const [docAutocompletado, setDocAutocompletado] = useState(false);

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
  // Costo siempre sale de envio_zonas / envio_distritos (100% administrable
  // desde /admin/envios) — antes las zonas de provincia pisaban el costo_envio
  // configurado con un flat rate hardcodeado (COSTO_SHALOM_PROVINCIA), lo que
  // hacía que editar la tarifa de esas zonas en el admin no tuviera efecto.
  const costoEnvio = !zona ? null : calcularCostoEnvio(zona, subtotal, costoDistrito);

  // Fuera de Lima Metropolitana/Callao el delivery motorizado no llega — solo
  // se ofrece Agencia Shalom. Dentro de Lima Metropolitana/Callao es al revés:
  // solo llega el motorizado propio, Shalom no opera ahí.
  const metodosDisponibles = esProvincia
    ? metodosEnvio.filter((m) => m.value === "shalom")
    : metodosEnvio.filter((m) => m.value === "motorizado");

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

  // Al elegir una sugerencia de Google se guardan las coordenadas y, si el
  // distrito es inequívoco, se preseleccionan los 3 dropdowns. Si el nombre es
  // ambiguo se dejan como estaban: la zona define el precio del envío, así que
  // un autocompletado errado le cobraría de más (o de menos) al cliente.
  function elegirDireccionDeMaps(elegida: DireccionElegida) {
    const ubigeo = ubicarDistrito(elegida.distrito);
    onChange({
      ...value,
      direccion: elegida.direccion,
      lat: elegida.lat,
      lng: elegida.lng,
      ...(ubigeo
        ? {
            departamento: ubigeo.departamento,
            provincia: ubigeo.provincia,
            distrito: ubigeo.distrito,
          }
        : {}),
    });
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
            Ya tenemos tu cuenta registrada — confirma o ajusta estos datos para tu envío y comprobante.
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
              Opcional, pero lo recomendamos: con tu documento el courier puede verificar tu
              identidad al entregarte el pedido.
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
          className={inputClass}
          // Escribir a mano invalida las coordenadas anteriores: si no, el
          // courier recibiría el pin de una dirección que ya no es la del pedido.
          onChange={(direccion) => onChange({ ...value, direccion, lat: null, lng: null })}
          onElegir={elegirDireccionDeMaps}
        />

        {value.lat !== null && value.lng !== null && (
          <MapaUbicacion
            lat={value.lat}
            lng={value.lng}
            onMover={(coords) => onChange({ ...value, lat: coords.lat, lng: coords.lng })}
          />
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
        ) : zona && costoEnvio !== null ? (
          <div className="flex flex-col gap-2">
            {metodosDisponibles.map((metodo) => {
              const seleccionado = value.metodoEnvio === metodo.value;
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
                        {metodo.nombre} — {zona.tiempo_estimado}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">{metodo.descripcion}</p>
                    </div>
                  </div>
                  <span className="shrink-0 font-body text-sm font-bold text-secondary">
                    {costoEnvio === 0 ? "GRATIS" : formatPrecio(costoEnvio)}
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
