"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user) {
      setError("Correo o contraseña incorrectos.");
      setCargando(false);
      return;
    }

    const { data: admin } = await supabase
      .from("admins")
      .select("activo")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!admin || !admin.activo) {
      setError("Esta cuenta no tiene acceso al panel administrativo.");
      await supabase.auth.signOut();
      setCargando(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Columna izquierda — formulario */}
      <div className="flex w-full flex-col justify-center px-mobile-margin py-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Image
            src="/logos/logo-color-horizontal.png"
            alt="Suplevet"
            width={140}
            height={30}
            priority
            className="mb-12"
          />

          <h1 className="font-display text-3xl font-bold text-secondary">Iniciar sesión</h1>
          <p className="mt-2 font-body text-sm text-muted-foreground">
            Bienvenido de nuevo. Ingresa tus credenciales.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <div>
              <label className="mb-1.5 block font-body text-sm font-medium text-secondary">
                Correo
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@suplevet.com"
                className="w-full rounded-xl border border-border px-4 py-2.5 font-body text-sm text-secondary placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-body text-sm font-medium text-secondary">
                Contraseña
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="w-full rounded-xl border border-border px-4 py-2.5 font-body text-sm text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoComplete="current-password"
              />
            </div>

            {error && <p className="font-body text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={cargando}
              className="mt-2 rounded-xl bg-primary px-4 py-2.5 font-body font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {cargando ? "Ingresando…" : "Ingresar"}
            </button>
          </form>
        </div>
      </div>

      {/* Columna derecha — identidad de marca */}
      <div className="relative hidden w-1/2 items-center justify-center bg-secondary lg:flex">
        <div className="absolute inset-0 organic-hill bg-secondary-foreground/[0.03]" />
        <div className="relative flex flex-col items-center gap-6 px-12 text-center">
          <Image
            src="/logos/logo-white-full-horizontal.png"
            alt="Suplevet"
            width={280}
            height={60}
            priority
          />
          <p className="font-body text-sm text-white/70">Panel administrativo</p>
        </div>
      </div>
    </div>
  );
}
