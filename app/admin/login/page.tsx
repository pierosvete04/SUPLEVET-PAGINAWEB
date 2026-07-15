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
    <div className="flex min-h-screen items-center justify-center bg-secondary px-mobile-margin">
      <div className="w-full max-w-sm rounded-md bg-white p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Image src="/logos/logo-color-horizontal.png" alt="Suplevet" width={150} height={32} priority />
          <h1 className="font-body text-lg font-bold text-secondary">Panel administrativo</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
              Correo
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border px-4 py-2.5 font-body text-sm text-secondary"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground">
              Contraseña
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border px-4 py-2.5 font-body text-sm text-secondary"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="font-body text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="mt-2 rounded-lg bg-primary px-4 py-2.5 font-body font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {cargando ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
