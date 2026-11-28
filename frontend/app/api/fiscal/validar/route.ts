// Proxy do scanner do fiscal: exige sessão fiscal (cookie httpOnly assinado) e
// acrescenta a FISCAL_SECRET_KEY no servidor — a chave nunca vai ao navegador.
import { NextRequest, NextResponse } from 'next/server';
import { FISCAL_COOKIE, getFiscalApiKey, sessaoFiscalValida } from '@/lib/fiscalSession';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL || 'https://sagaturismo-production.up.railway.app').replace(/\/$/, '');

export async function GET(req: NextRequest) {
  if (!sessaoFiscalValida(req.cookies.get(FISCAL_COOKIE)?.value)) {
    return NextResponse.json({ sucesso: false, mensagem: 'Sessão do fiscal expirada. Faça login novamente.' }, { status: 401 });
  }

  const token = (req.nextUrl.searchParams.get('token') || '').trim();
  if (!token || token.length > 200) {
    return NextResponse.json({ sucesso: false, mensagem: 'Token inválido ou ilegível.' }, { status: 400 });
  }

  const chave = getFiscalApiKey();
  if (!chave) {
    console.error('[fiscal/validar] FISCAL_SECRET_KEY não configurada.');
    return NextResponse.json({ sucesso: false, mensagem: 'Configuração do servidor inválida.' }, { status: 500 });
  }

  try {
    const res = await fetch(`${BACKEND}/api/v1/fiscal/validar/${encodeURIComponent(token)}`, {
      headers: { 'x-fiscal-key': chave },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ sucesso: false, mensagem: data?.detail ?? 'Acesso negado.' }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ sucesso: false, mensagem: 'Falha ao contactar o servidor central.' }, { status: 502 });
  }
}
