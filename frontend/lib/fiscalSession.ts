// lib/fiscalSession.ts — USO EXCLUSIVO NO SERVIDOR (route handlers / server components).
// Substitui a senha fixa no bundle e o cookie forjável "fiscal_auth=autenticado".
import { createHmac, createHash, timingSafeEqual } from 'crypto';

export const FISCAL_COOKIE = 'fiscal_session';
export const FISCAL_SESSION_SECONDS = 60 * 60 * 24; // 24h, igual ao comportamento anterior

function sessionSecret(): string {
  return process.env.FISCAL_SESSION_SECRET || process.env.FISCAL_SECRET_KEY || '';
}

function assinar(payload: string): string {
  return createHmac('sha256', sessionSecret()).update(payload).digest('hex');
}

function iguais(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Chave usada para falar com o backend (/api/v1/fiscal/validar). Nunca vai ao navegador. */
export function getFiscalApiKey(): string {
  return process.env.FISCAL_SECRET_KEY || '';
}

export function fiscalConfigurado(): boolean {
  return Boolean(sessionSecret() && process.env.FISCAL_LOGIN_PASSWORD && getFiscalApiKey());
}

export function senhaFiscalConfere(senha: string): boolean {
  const esperada = process.env.FISCAL_LOGIN_PASSWORD || '';
  if (!esperada || !senha) return false;
  return iguais(senha, esperada);
}

export function criarSessaoFiscal(): string {
  const exp = Math.floor(Date.now() / 1000) + FISCAL_SESSION_SECONDS;
  return `${exp}.${assinar(String(exp))}`;
}

export function sessaoFiscalValida(valor?: string | null): boolean {
  if (!valor || !sessionSecret()) return false;
  const [exp, assinatura] = valor.split('.');
  if (!exp || !assinatura || !/^\d+$/.test(exp)) return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false;
  return iguais(assinatura, assinar(exp));
}
