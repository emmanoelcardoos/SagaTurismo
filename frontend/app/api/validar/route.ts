// app/api/validar/route.ts
// Proxy seguro — a FISCAL_SECRET_KEY NUNCA vai ao cliente
import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL;
const SECRET  = process.env.FISCAL_SECRET_KEY;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ sucesso: false, mensagem: 'Token ausente.' }, { status: 400 });
  }

  if (!SECRET) {
    console.error('[validar proxy] FISCAL_SECRET_KEY não configurada.');
    return NextResponse.json({ sucesso: false, mensagem: 'Configuração do servidor inválida.' }, { status: 500 });
  }

  try {
    const res = await fetch(`${BACKEND}/api/v1/validar/${encodeURIComponent(token)}`, {
      headers: { 'x-fiscal-key': SECRET },
      cache: 'no-store',
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { sucesso: false, mensagem: data?.detail ?? 'Acesso negado.' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ sucesso: false, mensagem: 'Falha ao contactar o servidor.' }, { status: 502 });
  }
}