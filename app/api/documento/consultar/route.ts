import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Consulta RENIEC (DNI) / SUNAT (RUC) vía Decolecta para autocompletar el
// nombre en el checkout. Es un proxy server-only a propósito: el token de
// Decolecta se cobra por consulta, así que no puede vivir en el bundle del
// navegador ni quedar abierto a cualquiera — se exige sesión iniciada.
const DECOLECTA_BASE = "https://api.decolecta.com/v1";

interface DocumentoConsultado {
  nombre: string;
  apellidos: string;
  nombreCompleto: string;
}

function normalizar(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

async function consultarDni(numero: string, token: string): Promise<DocumentoConsultado | null> {
  const r = await fetch(`${DECOLECTA_BASE}/reniec/dni?numero=${numero}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!r.ok) return null;

  const d = await r.json();
  const nombre = normalizar(d.first_name);
  const apellidos = [normalizar(d.first_last_name), normalizar(d.second_last_name)]
    .filter(Boolean)
    .join(" ");
  if (!nombre && !apellidos) return null;

  return { nombre, apellidos, nombreCompleto: normalizar(d.full_name) || `${nombre} ${apellidos}`.trim() };
}

async function consultarRuc(numero: string, token: string): Promise<DocumentoConsultado | null> {
  const r = await fetch(`${DECOLECTA_BASE}/sunat/ruc?numero=${numero}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!r.ok) return null;

  const d = await r.json();
  const razonSocial = normalizar(d.razon_social);
  if (!razonSocial) return null;

  // Una empresa no tiene nombre/apellido — la razón social va completa en el
  // campo de nombre y el de apellidos queda vacío.
  return { nombre: razonSocial, apellidos: "", nombreCompleto: razonSocial };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const tipo = body?.tipo;
  const numero = normalizar(body?.numero);

  if (tipo === "dni" && !/^\d{8}$/.test(numero)) {
    return NextResponse.json({ error: "El DNI debe tener 8 dígitos" }, { status: 400 });
  }
  if (tipo === "ruc" && !/^\d{11}$/.test(numero)) {
    return NextResponse.json({ error: "El RUC debe tener 11 dígitos" }, { status: 400 });
  }
  if (tipo !== "dni" && tipo !== "ruc") {
    return NextResponse.json({ error: "Solo se puede consultar DNI o RUC" }, { status: 400 });
  }

  const token = process.env.DECOLECTA_API_TOKEN;
  if (!token) {
    // Sin token configurado el campo sigue siendo usable a mano — no se
    // rompe el checkout, solo no autocompleta.
    return NextResponse.json({ error: "La consulta automática no está disponible" }, { status: 503 });
  }

  try {
    const resultado = tipo === "dni" ? await consultarDni(numero, token) : await consultarRuc(numero, token);
    if (!resultado) {
      return NextResponse.json({ error: "No encontramos ese documento" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, ...resultado });
  } catch (error: unknown) {
    console.error("Error consultando documento:", error);
    return NextResponse.json({ error: "No pudimos consultar el documento" }, { status: 502 });
  }
}
