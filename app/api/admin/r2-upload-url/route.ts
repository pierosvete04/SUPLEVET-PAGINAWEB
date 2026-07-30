import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { r2Client, r2PublicUrl, R2_BUCKET } from "@/lib/r2";

// Reemplaza la subida directa a Supabase Storage: el navegador no tiene las
// credenciales de R2 (no hay RLS en R2 como en Supabase), así que esta ruta
// valida que quien pide la URL firmada es un admin activo — mismo criterio
// que middleware.ts usa para proteger /admin — y devuelve una URL de subida
// de un solo uso que expira a los 5 minutos.
const CARPETAS_PERMITIDAS = [
  "banners-fotos",
  "productos-web-fotos",
  "productos-web-videos",
  "blog-fotos",
  "cursos-contenido",
  "testimonios-videos",
  "pedidos-comprobantes",
] as const;

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

const bodySchema = z.object({
  folder: z.enum(CARPETAS_PERMITIDAS),
  // Subcarpeta dentro del bucket (ej. "desktop", "regalos/variantes") — misma
  // organización que tenían los buckets de Supabase Storage antes de migrar.
  subPath: z
    .string()
    .max(120)
    .regex(/^[a-zA-Z0-9/_-]*$/)
    .optional(),
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

  const { data: admin } = await supabase
    .from("admins")
    .select("activo")
    .eq("id", user.id)
    .maybeSingle();
  if (!admin?.activo) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { folder, subPath, fileName, contentType } = parsed.data;
  const prefix = subPath ? `${folder}/${subPath}` : folder;
  const key = `${prefix}/${Date.now()}-${sanitizarNombre(fileName)}`;

  const uploadUrl = await getSignedUrl(
    r2Client,
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 300 }
  );

  return NextResponse.json({ uploadUrl, publicUrl: r2PublicUrl(key), key });
}
