import { supabase } from "@/lib/supabase";

const FALLBACK_API_URL = "https://sagaturismo-production.up.railway.app";

export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  return (envUrl && envUrl.trim() ? envUrl.trim() : FALLBACK_API_URL).replace(/\/$/, "");
}

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Sessão expirada. Faça login novamente no portal.");
  }

  return session.access_token;
}

function extrairMensagemErro(payload: any, statusCode: number): string {
  if (!payload) return `Erro HTTP ${statusCode} ao comunicar com o servidor.`;
  if (typeof payload === "string") return payload;
  if (typeof payload.detail === "string") return payload.detail;
  if (Array.isArray(payload.detail)) {
    return payload.detail.map((d: any) => d?.msg || JSON.stringify(d)).join("; ");
  }
  if (typeof payload.mensagem === "string") return payload.mensagem;
  if (typeof payload.erro === "string") return payload.erro;
  return `Erro HTTP ${statusCode} ao processar solicitação.`;
}

export async function portalFetchJson<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();
  const baseUrl = getApiBaseUrl();
  const url = path.startsWith("http")
    ? path
    : `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const resp = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });

  const text = await resp.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!resp.ok) {
    throw new Error(extrairMensagemErro(json, resp.status));
  }

  return json as T;
}

export async function portalFetchBlob(
  path: string,
  options: RequestInit = {}
): Promise<{ blob: Blob; filename: string }> {
  const token = await getAccessToken();
  const baseUrl = getApiBaseUrl();
  const url = path.startsWith("http")
    ? path
    : `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  const resp = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!resp.ok) {
    const text = await resp.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }
    throw new Error(extrairMensagemErro(json, resp.status));
  }

  const disposition = resp.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || "Carteira_Residente.pdf";
  const blob = await resp.blob();

  return { blob, filename };
}
