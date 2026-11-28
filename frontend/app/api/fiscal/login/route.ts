import { NextResponse } from 'next/server';
import {
  FISCAL_COOKIE,
  FISCAL_SESSION_SECONDS,
  criarSessaoFiscal,
  fiscalConfigurado,
  senhaFiscalConfere,
} from '@/lib/fiscalSession';

export async function POST(request: Request) {
  if (!fiscalConfigurado()) {
    console.error('[fiscal/login] FISCAL_LOGIN_PASSWORD / FISCAL_SECRET_KEY não configuradas no servidor.');
    return NextResponse.json({ sucesso: false, mensagem: 'Acesso fiscal indisponível: servidor não configurado.' }, { status: 503 });
  }

  let senha = '';
  try {
    const body = await request.json();
    senha = String(body?.senha || '');
  } catch {
    /* corpo inválido */
  }

  if (!senhaFiscalConfere(senha)) {
    // Atraso fixo para dificultar tentativas em massa
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ sucesso: false, mensagem: 'Credencial inválida. Acesso restrito a fiscais.' }, { status: 401 });
  }

  const res = NextResponse.json({ sucesso: true });
  res.cookies.set(FISCAL_COOKIE, criarSessaoFiscal(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: FISCAL_SESSION_SECONDS,
  });
  return res;
}
