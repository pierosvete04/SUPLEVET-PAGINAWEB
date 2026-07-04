import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente sin cookies para contextos sin request (generateStaticParams, build
// time) — lib/supabase/server.ts usa next/headers, que falla fuera de una
// request real.
export function createStaticClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
