import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { r2Client, r2PublicUrl, R2_BUCKET } from "@/lib/r2";

// Equivalente a app/api/admin/r2-upload-url pero para clientes del portal
// (/mi-cuenta): no requiere ser admin, solo sesión activa. Como cualquier
// cliente logueado puede llamar esta ruta, el subPath se obliga a empezar
// con el propio user.id (mismo aislamiento que antes daba la política RLS
// de Supabase Storage sobre estos buckets) — así un cliente no puede
// escribir en la carpeta de otro cliente adivinando su id.
const CARPETAS_PERMITIDAS = ["mascotas-fotos", "comunidad-fotos"] as const;

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

const bodySchema = z.object({
  folder: z.enum(CARPETAS_PERMITIDAS),
  subPath: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-zA-Z0-9/_-]*$/),
  fileName: z.string().min(1).max(200),
  contentType: z.enum(TIPOS_PERMITIDOS),
});

function sanitizarNombre(nombre: string): string {
  return nombre.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { folder, subPath, fileName, contentType } = parsed.data;
  if (subPath !== user.id && !subPath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const key = `${folder}/${subPath}/${Date.now()}-${sanitizarNombre(fileName)}`;

  const uploadUrl = await getSignedUrl(
    r2Client,
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 300 }
  );

  return NextResponse.json({ uploadUrl, publicUrl: r2PublicUrl(key), key });
}
