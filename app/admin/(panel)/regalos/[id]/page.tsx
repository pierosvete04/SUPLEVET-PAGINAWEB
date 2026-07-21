"use client";

import { use } from "react";
import { RegaloVariantesManager } from "@/components/admin/regalos/RegaloVariantesManager";

export default function AdminRegaloVariantesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RegaloVariantesManager regaloId={id} />;
}
