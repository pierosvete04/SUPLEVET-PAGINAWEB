"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Check, Loader2, Search, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ClientePerfil } from "@/lib/data/portal/cliente";
import { consultarDocumento, esConsultable, largoEsperado, TIPOS_DOCUMENTO, type TipoDocumento } from "@/lib/documento";
import { MaskedTextReveal } from "@/components/shared/MaskedTextReveal";

interface CompletarPerfilFormProps {
  user: User;
  perfilInicial: ClientePerfil | null;
}

const inputClass =
  "w-full rounded-md border border-border px-4 py-3 font-body text-sm text-secondary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50";

// Único paso obligatorio antes de entrar al portal (ver
// app/mi-cuenta/(portal)/layout.tsx). Solo pide lo esencial para poder
// procesar un pedido — nombre, forma de contacto y dirección — con el DNI
// como atajo opcional (misma consulta RENIEC/SUNAT que ya usa el checkout,
// ver lib/documento.ts) para no tener que escribir el nombre a mano.
export function CompletarPerfilForm({ user, perfilInicial }: CompletarPerfilFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: perfilInicial?.nombre ?? "",
    apellido: perfilInicial?.apellido ?? "",
    telefono: perfilInicial?.telefono ?? "",
    direccion: perfilInicial?.direccion ?? "",
    distrito: perfilInicial?.distrito ?? "",
    ciudad: perfilInicial?.ciudad ?? "Lima",
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

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.apellido.trim() || !form.telefono.trim() || !form.direccion.trim() || !form.distrito.trim()) {
      setError("Completa todos los campos para continuar");
      return;
    }
    setGuardando(true);
    setError(null);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("clientes_perfil")
      .update({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        telefono: form.telefono.trim(),
        direccion: form.direccion.trim(),
        distrito: form.distrito.trim(),
        ciudad: form.ciudad.trim(),
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

    router.push("/mi-cuenta/bienvenida");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-mobile-margin py-section-y">
      <div className="w-full max-w-md rounded-[var(--radius-card,1rem)] bg-white p-8 shadow-lg">
        <UserRound className="mx-auto h-10 w-10 text-secondary" strokeWidth={1.5} />
        <MaskedTextReveal as="h1" className="mt-3 text-center font-display text-lg font-bold text-secondary">
          Completa tu perfil
        </MaskedTextReveal>
        <MaskedTextReveal
          as="p"
          type="words"
          delay={0.3}
          className="mt-2 text-center font-body text-xs text-muted-foreground"
        >
          Antes de entrar, cuéntanos lo básico para poder atenderte y enviarte tus pedidos.
        </MaskedTextReveal>

        <form onSubmit={handleGuardar} className="mt-6 flex flex-col gap-3">
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
                    className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 font-body text-xs font-bold text-secondary transition-opacity hover:bg-soft-gray disabled:opacity-40"
                  >
                    {consultandoDoc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                    Buscar
                  </button>
                )}
              </div>
            </div>
            {errorDoc ? (
              <p className="font-body text-xs text-destructive">{errorDoc}</p>
            ) : docAutocompletado ? (
              <p className="flex items-center gap-1 font-body text-xs text-green-700">
                <Check className="h-3.5 w-3.5" /> Nombre y apellido completados abajo.
              </p>
            ) : (
              <p className="font-body text-xs text-muted-foreground">
                Con tu DNI autocompletamos tu nombre — o escríbelo tú mismo abajo.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
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

          <input
            type="tel"
            value={form.telefono}
            onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
            placeholder="Teléfono"
            required
            className={inputClass}
          />

          <input
            value={form.direccion}
            onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
            placeholder="Dirección"
            required
            className={inputClass}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              value={form.distrito}
              onChange={(e) => setForm((f) => ({ ...f, distrito: e.target.value }))}
              placeholder="Distrito"
              required
              className={inputClass}
            />
            <input
              value={form.ciudad}
              onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))}
              placeholder="Ciudad"
              required
              className={inputClass}
            />
          </div>

          {error && <p className="font-body text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={guardando}
            className="mt-2 rounded-[17px] bg-primary px-6 py-3 font-body font-bold text-primary-foreground disabled:opacity-60"
          >
            {guardando ? "Guardando…" : "Continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}
