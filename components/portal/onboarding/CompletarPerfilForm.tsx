"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UsuarioSesion } from "@/lib/supabase/usuario";
import { ArrowLeft, Check, Loader2, Search, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ClientePerfil } from "@/lib/data/portal/cliente";
import { acreditarPuntos } from "@/lib/data/portal/puntos";
import { consultarDocumento, esConsultable, largoEsperado, TIPOS_DOCUMENTO, type TipoDocumento } from "@/lib/documento";
import { MaskedTextReveal } from "@/components/shared/MaskedTextReveal";

interface CompletarPerfilFormProps {
  user: UsuarioSesion;
  perfilInicial: ClientePerfil | null;
}

const inputClass =
  "w-full rounded-md border border-portal-surface-variant px-4 py-3 font-body text-sm text-portal-navy placeholder:text-portal-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-portal-teal-light disabled:opacity-50";

// Un paso por container: documento (opcional) → nombre → celular → dirección
// (opcional — si la saltan, la piden igual en el checkout, ver
// ShippingStep.tsx). El correo no se pide — ya se conoce por el login OTP
// (user.email) y cambiarlo pasa por el flujo de cambio de correo, no por acá.
const TOTAL_PASOS = 4;

// Arranca en 20% en vez de 0% apenas entra (recién pasó el OTP, así que ya
// "algo" hizo) para que la barra motive a seguir en vez de desanimar —
// pedido explícito de negocio. Del 20 al 100 se reparte en partes iguales
// entre los pasos restantes.
function calcularProgreso(paso: number): number {
  return Math.round(20 + (paso / TOTAL_PASOS) * 80);
}

// Único paso obligatorio antes de entrar al portal (ver
// app/mi-cuenta/(portal)/layout.tsx). Solo pide lo esencial para poder
// contactar al cliente — nombre y forma de contacto — con el DNI y la
// dirección como atajos opcionales (misma consulta RENIEC/SUNAT que ya usa
// el checkout, ver lib/documento.ts) para no tener que escribir el nombre a
// mano ni repetir la dirección si ya la puso acá.
export function CompletarPerfilForm({ user, perfilInicial }: CompletarPerfilFormProps) {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [form, setForm] = useState({
    nombre: perfilInicial?.nombre ?? "",
    apellido: perfilInicial?.apellido ?? "",
    telefono: perfilInicial?.telefono ?? "",
    direccion: perfilInicial?.direccion ?? "",
    tipo_documento: (perfilInicial?.tipo_documento as TipoDocumento) ?? "dni",
    numero_documento: perfilInicial?.numero_documento ?? "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [consultandoDoc, setConsultandoDoc] = useState(false);
  const [errorDoc, setErrorDoc] = useState<string | null>(null);
  const [docAutocompletado, setDocAutocompletado] = useState(false);

  const docLargo = largoEsperado(form.tipo_documento);
  const puedeConsultarDoc = docLargo ? form.numero_documento.length === docLargo : false;

  function setNumeroDocumento(numero: string) {
    setErrorDoc(null);
    setDocAutocompletado(false);
    const limpio = numero.replace(/\D/g, "");
    setForm((f) => ({ ...f, numero_documento: docLargo ? limpio.slice(0, docLargo) : limpio.slice(0, 20) }));
  }

  async function consultar() {
    if (!puedeConsultarDoc || consultandoDoc) return;
    setConsultandoDoc(true);
    setErrorDoc(null);
    const { datos, error: errorConsulta } = await consultarDocumento(
      form.tipo_documento as "dni" | "ruc",
      form.numero_documento
    );
    if (datos) {
      setForm((f) => ({ ...f, nombre: datos.nombre, apellido: datos.apellidos }));
      setDocAutocompletado(true);
    } else {
      setErrorDoc(errorConsulta);
    }
    setConsultandoDoc(false);
  }

  // Documento (paso 0) y dirección (paso 3) son opcionales y nunca bloquean
  // el avance — solo nombre/apellido y celular son obligatorios.
  function validarPaso(): string | null {
    if (paso === 1 && (!form.nombre.trim() || !form.apellido.trim())) return "Completa tu nombre y apellido";
    if (paso === 2 && !form.telefono.trim()) return "Completa tu celular";
    return null;
  }

  async function guardarPerfil() {
    setGuardando(true);
    setError(null);
    const supabase = createClient();

    // Mismo chequeo que components/portal/perfil/PerfilForm.tsx: este wizard
    // es el paso obligatorio de onboarding, así que para casi todo cliente
    // nuevo perfil_completo pasa de false a true justo acá — sin este
    // acreditarPuntos() el bono de +30 quedaba inalcanzable para siempre,
    // porque PerfilForm.tsx solo lo otorga cuando detecta esa misma
    // transición false→true.
    const { data: perfilAntes } = await supabase
      .from("clientes_perfil")
      .select("perfil_completo")
      .eq("id", user.id)
      .maybeSingle();

    const { error: updateError } = await supabase
      .from("clientes_perfil")
      .update({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        telefono: form.telefono.trim(),
        direccion: form.direccion.trim() || null,
        tipo_documento: form.numero_documento ? form.tipo_documento : null,
        numero_documento: form.numero_documento || null,
        perfil_completo: true,
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setGuardando(false);
      return;
    }

    if (!perfilAntes?.perfil_completo) {
      const { data: yaAcreditado } = await supabase
        .from("suplepuntos_transacciones")
        .select("id")
        .eq("cliente_id", user.id)
        .eq("accion", "perfil_completo")
        .limit(1);
      if (!yaAcreditado || yaAcreditado.length === 0) {
        await acreditarPuntos(supabase, user.id, "perfil_completo", 30, "Perfil completado");
      }
    }

    router.push("/mi-cuenta/bienvenida");
    router.refresh();
  }

  function handleContinuar(e: React.FormEvent) {
    e.preventDefault();
    const mensaje = validarPaso();
    if (mensaje) {
      setError(mensaje);
      return;
    }
    setError(null);
    if (paso === TOTAL_PASOS - 1) {
      guardarPerfil();
      return;
    }
    setPaso((p) => p + 1);
  }

  function handleAtras() {
    setError(null);
    setPaso((p) => Math.max(0, p - 1));
  }

  // Al guardar (último paso confirmado) salta a 100% de una vez — la
  // sensación de meta cumplida, en vez de quedarse en 80% mientras redirige.
  const progreso = guardando ? 100 : calcularProgreso(paso);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-portal-navy to-portal-navy-dark px-mobile-margin py-section-y">
      <div className="w-full max-w-md rounded-[18px] bg-white p-8 shadow-lg">
        <UserRound className="mx-auto h-10 w-10 text-portal-orange" strokeWidth={1.5} />
        <MaskedTextReveal as="h1" className="mt-3 text-center font-display text-lg font-bold text-portal-navy">
          Completa tu perfil
        </MaskedTextReveal>
        <MaskedTextReveal
          as="p"
          type="words"
          delay={0.3}
          className="mt-2 text-center font-body text-xs text-portal-muted"
        >
          Antes de entrar, cuéntanos lo básico para poder atenderte y enviarte tus pedidos.
        </MaskedTextReveal>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span className="font-body text-xs font-bold text-portal-navy">Tu progreso</span>
            <span className="font-body text-xs font-bold text-portal-orange">{progreso}%</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-portal-surface-low">
            <div
              className="h-full rounded-full bg-portal-orange transition-all duration-500"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleContinuar} className="mt-5 flex flex-col gap-3">
          {paso === 0 && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,9rem)_1fr]">
                <select
                  value={form.tipo_documento}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, tipo_documento: e.target.value as TipoDocumento }));
                    setErrorDoc(null);
                    setDocAutocompletado(false);
                  }}
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
                    inputMode="numeric"
                    placeholder="N° de documento (opcional)"
                    value={form.numero_documento}
                    onChange={(e) => setNumeroDocumento(e.target.value)}
                    className={`${inputClass} min-w-0 flex-1`}
                  />
                  {esConsultable(form.tipo_documento) && (
                    <button
                      type="button"
                      onClick={consultar}
                      disabled={!puedeConsultarDoc || consultandoDoc}
                      className="flex shrink-0 items-center gap-1.5 rounded-md border border-portal-surface-variant px-3 font-body text-xs font-bold text-portal-navy transition-opacity hover:bg-portal-surface-low disabled:opacity-40"
                    >
                      {consultandoDoc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                      Buscar
                    </button>
                  )}
                </div>
              </div>
              {errorDoc ? (
                <p className="font-body text-xs text-portal-error">{errorDoc}</p>
              ) : docAutocompletado ? (
                <p className="flex items-center gap-1 font-body text-xs text-green-700">
                  <Check className="h-3.5 w-3.5" /> Nombre y apellido completados en el siguiente paso.
                </p>
              ) : (
                <p className="font-body text-xs text-portal-muted">
                  Con tu DNI autocompletamos tu nombre — o escríbelo tú mismo en el siguiente paso. Este dato es
                  opcional, puedes continuar sin llenarlo.
                </p>
              )}
            </div>
          )}

          {paso === 1 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                autoFocus
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Nombre"
                required
                className={inputClass}
              />
              <input
                value={form.apellido}
                onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))}
                placeholder="Apellido"
                required
                className={inputClass}
              />
            </div>
          )}

          {paso === 2 && (
            <input
              autoFocus
              type="tel"
              value={form.telefono}
              onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              placeholder="Celular"
              required
              className={inputClass}
            />
          )}

          {paso === 3 && (
            <div className="flex flex-col gap-2">
              <input
                autoFocus
                value={form.direccion}
                onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                placeholder="Dirección (opcional)"
                className={inputClass}
              />
              <p className="font-body text-xs text-portal-muted">
                Opcional — si la dejas en blanco, te la pediremos al momento de tu primera compra.
              </p>
            </div>
          )}

          {error && <p className="font-body text-sm text-portal-error">{error}</p>}

          <div className="mt-2 flex gap-2">
            {paso > 0 && (
              <button
                type="button"
                onClick={handleAtras}
                className="flex items-center justify-center gap-1 rounded-[17px] border border-portal-surface-variant px-4 py-3 font-body text-sm font-bold text-portal-navy"
              >
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </button>
            )}
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 rounded-[17px] bg-portal-orange px-6 py-3 font-body font-bold text-white transition-colors hover:bg-portal-orange-dark disabled:opacity-60"
            >
              {guardando ? "Guardando…" : paso === TOTAL_PASOS - 1 ? "Finalizar" : "Continuar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
