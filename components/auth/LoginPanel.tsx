"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { inicializarSesionCliente } from "@/lib/data/portal/cliente";
import { CodigoOtpInput } from "@/components/auth/CodigoOtpInput";
import { cn } from "@/lib/utils";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface LoginPanelProps {
  className?: string;
  /** A dónde volver tras el OTP cuando no hay onAuthenticated (el portal). */
  next?: string;
  /** Si se pasa, el login no navega — el caller decide qué hacer (checkout). */
  onAuthenticated?: (user: User) => void;
}

// Login único para toda la web pública (checkout obligatorio y /mi-cuenta):
// mismo componente, mismo proyecto Supabase, mismas cookies de sesión — así
// quien ya inició sesión en un lado entra directo al otro sin repetir el
// login. Estructura tomada de referencia shadcn "login-04" (formulario +
// panel lateral), con el único acceso real del sitio: código OTP por correo.
export function LoginPanel({ className, next = "/mi-cuenta", onAuthenticated }: LoginPanelProps) {
  const router = useRouter();
  const [paso, setPaso] = useState<"email" | "codigo">("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Evita que el auto-envío (al llegar al sexto dígito) dispare dos veces:
  // el estado `cargando` no se actualiza a tiempo dentro del mismo render.
  const verificandoRef = useRef(false);

  async function handleEnviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Ingresa un correo válido");
      return;
    }
    setCargando(true);
    try {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
        body: JSON.stringify({ email, options: { shouldCreateUser: true } }),
      });
      if (!r.ok) {
        const d = await r.json();
        setError(d.msg || d.error_description || "No pudimos enviar el código");
        return;
      }
      setPaso("codigo");
    } catch {
      setError("Error de conexión, intenta de nuevo");
    } finally {
      setCargando(false);
    }
  }

  const verificarCodigo = useCallback(
    async (token: string) => {
      if (verificandoRef.current) return;
      setError(null);
      if (token.length < 6) {
        setError("Ingresa el código completo");
        return;
      }
      verificandoRef.current = true;
      setCargando(true);
      try {
        const supabase = createClient();
        // verifyOtp deja la sesión (y las cookies) puesta en una sola llamada.
        // Antes era fetch a /auth/v1/verify + setSession, y setSession vuelve a
        // pegarle a /auth/v1/user: dos viajes de ida y vuelta para lo mismo.
        const { data, error: errorOtp } = await supabase.auth.verifyOtp({
          email,
          token,
          type: "email",
        });
        if (errorOtp || !data.user) {
          // Supabase responde en inglés ("Token has expired or is invalid").
          setError(
            /expired|invalid/i.test(errorOtp?.message ?? "")
              ? "El código es incorrecto o ya venció. Pide uno nuevo."
              : "No pudimos verificar el código, intenta de nuevo"
          );
          setCodigo("");
          return;
        }

        // Un solo round-trip: crea las filas del cliente, vincula pedidos
        // previos de Shopify y nos dice a dónde mandarlo.
        const sesion = await inicializarSesionCliente(supabase);

        if (onAuthenticated) {
          onAuthenticated(data.user);
          return;
        }

        const destino = sesion.esInterna
          ? "/admin"
          : sesion.esNuevo
            ? "/mi-cuenta/bienvenida"
            : !sesion.perfilCompleto
              ? "/mi-cuenta/completar-perfil"
              : next;
        // replace (no push): el login no debe quedar en el historial. Vamos
        // directo al destino final para ahorrarnos el rebote que hacía el
        // layout del portal cuando el perfil aún estaba incompleto.
        router.replace(destino);
      } catch {
        setError("Error de conexión, intenta de nuevo");
      } finally {
        verificandoRef.current = false;
        setCargando(false);
      }
    },
    [email, next, onAuthenticated, router]
  );

  // Al completar los 6 dígitos (escritos, pegados o autocompletados) se envía
  // solo — un clic menos y ningún código a medias.
  useEffect(() => {
    if (paso === "codigo" && codigo.length === 6) {
      void verificarCodigo(codigo);
    }
  }, [codigo, paso, verificarCodigo]);

  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-[var(--radius-card,1rem)] bg-white shadow-lg md:grid-cols-2",
        className
      )}
    >
      <div className="flex flex-col justify-center p-8 md:p-10">
        {paso === "email" ? (
          <form onSubmit={handleEnviarCodigo} className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-2 text-center">
              <Image
                src="/logos/icon-only/icon-outline-celeste.png"
                alt="Suplevet"
                width={64}
                height={64}
                className="h-16 w-16 object-contain md:hidden"
                priority
              />
              <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 font-body text-xs font-semibold text-secondary">
                No necesitas registrarte antes
              </span>
              <h1 className="font-display text-2xl font-bold text-secondary">Ingresa con tu correo</h1>
              <p className="text-balance font-body text-sm text-muted-foreground">
                Escribe tu correo y te enviamos un código de 6 dígitos. ¿Primera vez? Tu cuenta se
                crea sola en ese momento. ¿Ya compraste antes? Entras directo. Sin formularios, sin
                contraseña.
              </p>
            </div>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="rounded-lg bg-soft-gray px-4 py-3 font-body text-sm text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />

            {error && <p className="font-body text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={cargando}
              className="rounded-[17px] bg-primary px-6 py-3 font-body font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {cargando ? "Enviando…" : "Enviar código"}
            </button>

            <p className="text-center font-body text-xs text-muted-foreground">
              Te llegará un código a tu correo en segundos. No necesitas crear una cuenta ni
              recordar contraseñas.
            </p>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void verificarCodigo(codigo);
            }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="font-display text-2xl font-bold text-secondary">Revisa tu correo</h1>
              <p className="text-balance font-body text-sm text-muted-foreground">
                Enviamos un código de 6 dígitos a <strong className="text-secondary">{email}</strong>
              </p>
            </div>

            <CodigoOtpInput value={codigo} onChange={setCodigo} disabled={cargando} />

            <p className="text-center font-body text-xs text-muted-foreground">
              Puedes copiar el código del correo y pegarlo aquí completo.
            </p>

            {error && <p className="text-center font-body text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={cargando || codigo.length < 6}
              className="rounded-[17px] bg-primary px-6 py-3 font-body font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {cargando ? "Verificando…" : "Confirmar"}
            </button>

            <button
              type="button"
              onClick={() => {
                setPaso("email");
                setCodigo("");
                setError(null);
              }}
              className="text-center font-body text-xs text-muted-foreground underline underline-offset-4"
            >
              Usar otro correo
            </button>
          </form>
        )}
      </div>

      <div className="relative hidden items-center justify-center bg-accent p-10 md:flex">
        <Image
          src="/logos/logo-navy-stacked.png"
          alt="Suplevet"
          width={220}
          height={220}
          className="h-auto w-44 object-contain"
          priority
        />
      </div>
    </div>
  );
}
