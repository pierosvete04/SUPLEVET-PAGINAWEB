"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { asegurarClienteInicializado } from "@/lib/data/portal/cliente";
import { cn } from "@/lib/utils";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface LoginPanelProps {
  className?: string;
  /** A dónde volver tras Google/OTP cuando no hay onAuthenticated (el portal). */
  next?: string;
  /** Si se pasa, el login no navega — el caller decide qué hacer (checkout). */
  onAuthenticated?: (user: User) => void;
}

// Login único para toda la web pública (checkout obligatorio y /mi-cuenta):
// mismo componente, mismo proyecto Supabase, mismas cookies de sesión — así
// quien ya inició sesión en un lado entra directo al otro sin repetir el
// login. Estructura tomada de referencia shadcn "login-04" (formulario +
// panel lateral), con los accesos reales del sitio: Google y código OTP.
export function LoginPanel({ className, next = "/mi-cuenta", onAuthenticated }: LoginPanelProps) {
  const router = useRouter();
  const [paso, setPaso] = useState<"email" | "codigo">("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState(["", "", "", "", "", ""]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

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
      setTimeout(() => inputsRef.current[0]?.focus(), 100);
    } catch {
      setError("Error de conexión, intenta de nuevo");
    } finally {
      setCargando(false);
    }
  }

  async function handleVerificarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const token = codigo.join("");
    if (token.length < 6) {
      setError("Ingresa el código completo");
      return;
    }
    setCargando(true);
    try {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
        body: JSON.stringify({ email, token, type: "magiclink" }),
      });
      const data = await r.json();
      if (!r.ok || !data.access_token) {
        setError(data.error_description || data.msg || "Código incorrecto");
        return;
      }
      const supabase = createClient();
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      const { esNuevo } = await asegurarClienteInicializado(supabase, data.user);
      if (onAuthenticated) {
        onAuthenticated(data.user);
        return;
      }
      router.push(esNuevo ? "/mi-cuenta/bienvenida" : next);
      router.refresh();
    } catch {
      setError("Error de conexión, intenta de nuevo");
    } finally {
      setCargando(false);
    }
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  }

  function handleDigitoChange(i: number, valor: string) {
    if (!/^\d?$/.test(valor)) return;
    const nuevo = [...codigo];
    nuevo[i] = valor;
    setCodigo(nuevo);
    if (valor && i < 5) inputsRef.current[i + 1]?.focus();
  }

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
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="font-display text-2xl font-bold text-secondary">Bienvenido de vuelta</h1>
              <p className="text-balance font-body text-sm text-muted-foreground">
                Ingresa tu correo para recibir un código de acceso instantáneo.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-3 font-body text-sm font-bold text-secondary transition-colors hover:bg-soft-gray"
            >
              <GoogleIcon />
              Continuar con Google
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="font-body text-xs font-bold text-muted-foreground">O usa tu correo</span>
              <div className="h-px flex-1 bg-border" />
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
              className="rounded-full bg-primary px-6 py-3 font-body font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {cargando ? "Enviando…" : "Enviar código"}
            </button>

            <p className="text-center font-body text-xs text-muted-foreground">
              Recibirás un código de 6 dígitos. No necesitas contraseña.
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerificarCodigo} className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="font-display text-2xl font-bold text-secondary">Revisa tu correo</h1>
              <p className="text-balance font-body text-sm text-muted-foreground">
                Enviamos un código de 6 dígitos a <strong className="text-secondary">{email}</strong>
              </p>
            </div>

            <div className="flex justify-center gap-2">
              {codigo.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitoChange(i, e.target.value)}
                  className="h-12 w-10 rounded-lg border border-border text-center font-body text-lg font-bold text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              ))}
            </div>

            {error && <p className="text-center font-body text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={cargando}
              className="rounded-full bg-primary px-6 py-3 font-body font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {cargando ? "Verificando…" : "Confirmar"}
            </button>

            <button
              type="button"
              onClick={() => setPaso("email")}
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
