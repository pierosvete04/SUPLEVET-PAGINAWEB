"use client";

import { use } from "react";
import { CursoContenidoManager } from "@/components/admin/cursos/CursoContenidoManager";

export default function AdminCursoContenidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <CursoContenidoManager cursoId={id} />;
}
