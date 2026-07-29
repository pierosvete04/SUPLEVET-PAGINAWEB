import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/emails/send";
import { formatCorrelativoReclamo } from "@/lib/data/libro-reclamaciones-admin";

// Llamado por el botón "Enviar respuesta" en
// app/admin/(panel)/libro-reclamaciones/[id]. Pasa por una ruta API (en vez
// de un UPDATE directo desde el cliente) porque acá hay que mandarle el
// correo con la respuesta al consumidor, y RESEND_API_KEY no puede vivir en
// el navegador. Marca el reclamo como "resuelto" — Ley N.° 29571 exige que
// el proveedor responda, no solo que quede una nota interna.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const respuesta = typeof body?.respuesta === "string" ? body.respuesta.trim() : "";

  if (!respuesta) {
    return NextResponse.json({ error: "La respuesta no puede estar vacía." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: reclamo, error } = await supabase
    .from("libro_reclamaciones")
    .update({ respuesta_proveedor: respuesta, respondido_at: new Date().toISOString(), estado: "resuelto" })
    .eq("id", id)
    .select("correlativo, created_at, tipo_solicitud, consumidor_nombre, consumidor_email")
    .maybeSingle();

  if (error || !reclamo) {
    return NextResponse.json(
      { error: error?.message ?? "No autorizado o reclamo no encontrado" },
      { status: 403 }
    );
  }

  const { error: sendError } = await sendTransactionalEmail(reclamo.consumidor_email, {
    tipo: "libro_reclamacion_respondido",
    data: {
      nombre: reclamo.consumidor_nombre,
      correlativo: formatCorrelativoReclamo(reclamo.correlativo, reclamo.created_at),
      tipoSolicitud: reclamo.tipo_solicitud,
      respuesta,
    },
  });

  if (sendError) {
    console.error("No se pudo enviar el correo de respuesta al reclamo:", sendError);
    return NextResponse.json({ ok: true, correoEnviado: false });
  }

  return NextResponse.json({ ok: true, correoEnviado: true });
}
