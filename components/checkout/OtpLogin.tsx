"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface OtpLoginProps {
  onSuccess: () => void;
}

// Replica el flujo que ya funciona en el portal de clientes existente
// (PORTAL DE CLIENTES/portal/assets/js/auth.js): 2 pasos, email -> código de
// 6 dígitos, contra el mismo proyecto de Supabase — así una cuenta creada acá
// es la misma cuenta del portal (mascotas, puntos, etc.), sin registro nuevo.
export function OtpLogin({ onSuccess }: OtpLoginProps) {
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
      // Establece la sesión vía el cliente de Supabase (cookies), para que el
      // resto de la app (Server Components incluidos) reconozca al usuario.
      const supabase = createClient();
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      onSuccess();
    } catch {
      setError("Error de conexión, intenta de nuevo");
    } finally {
      setCargando(false);
    }
  }

  function handleDigitoChange(i: number, valor: string) {
    if (!/^\d?$/.test(valor)) return;
    const nuevo = [...codigo];
    nuevo[i] = valor;
    setCodigo(nuevo);
    if (valor && i < 5) inputsRef.current[i + 1]?.focus();
  }

  return (
    <div className="mx-auto grid max-w-3xl grid-cols-1 overflow-hidden rounded-2xl border border-border md:grid-cols-2">
      <div className="p-8">
        <h1 className="font-display text-2xl font-bold text-secondary">Bienvenido de vuelta</h1>

        {paso === "email" ? (
          <form onSubmit={handleEnviarCodigo} className="mt-4 flex flex-col gap-4">
            <p className="font-body text-sm text-muted-foreground">
              Ingresa tu correo para recibir un código de acceso instantáneo.
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              className="rounded-lg bg-soft-gray px-4 py-3 font-body text-sm text-secondary"
            />
            {error && <p className="font-body text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={cargando}
              className="rounded-full bg-primary px-6 py-3 font-body font-bold text-primary-foreground disabled:opacity-60"
            >
              {cargando ? "Enviando…" : "Enviar código OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerificarCodigo} className="mt-4 flex flex-col gap-4">
            <p className="font-body text-sm text-muted-foreground">
              Enviamos un código de 6 dígitos a <strong>{email}</strong>
            </p>
            <div className="flex gap-2">
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
                  className="h-12 w-10 rounded-lg border border-border text-center font-body text-lg font-bold text-secondary"
                />
              ))}
            </div>
            {error && <p className="font-body text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={cargando}
              className="rounded-full bg-primary px-6 py-3 font-body font-bold text-primary-foreground disabled:opacity-60"
            >
              {cargando ? "Verificando…" : "Confirmar"}
            </button>
            <button
              type="button"
              onClick={() => setPaso("email")}
              className="font-body text-xs text-muted-foreground underline"
            >
              Usar otro correo
            </button>
          </form>
        )}
      </div>

      <div className="relative hidden md:block">
        <Image
          src="https://bcahhdszzwearqaafhpa.supabase.co/storage/v1/object/public/productos-web-fotos/suplevet-250g/lifestyle-perro.png"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="50vw"
        />
      </div>
    </div>
  );
}
