// lib/serverAuth.ts — USO EXCLUSIVO EM ROUTE HANDLERS (servidor). Não importar em componentes "use client".
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  { auth: { persistSession: false, autoRefreshToken: false } }
);

/**
 * Exige uma sessão válida do Supabase Auth (operador do portal) no cabeçalho
 * Authorization: Bearer <access_token>. O cadastro público está desativado no
 * Supabase, logo apenas contas convidadas obtêm sessão.
 * Devolve o utilizador ou uma resposta 401 pronta a ser retornada.
 */
export async function requirePortalUser(request: Request) {
  const header = request.headers.get('authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return { user: null, error: NextResponse.json({ error: 'Autenticação obrigatória.' }, { status: 401 }) };
  }
  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data?.user) {
    return { user: null, error: NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 }) };
  }
  return { user: data.user, error: null };
}
