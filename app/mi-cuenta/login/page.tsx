import type { Metadata } from "next";
import { LoginPanel } from "@/components/auth/LoginPanel";

export const metadata: Metadata = {
  title: "Portal de clientes",
};

export default function PortalLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-soft-gray px-mobile-margin py-section-y">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginPanel next="/mi-cuenta" />
      </div>
    </div>
  );
}
