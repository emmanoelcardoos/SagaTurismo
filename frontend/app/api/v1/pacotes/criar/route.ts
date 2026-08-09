import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usamos a chave secreta para furar o RLS de forma segura do lado do servidor
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const { pacoteData, itensData } = await request.json();

    // 1. Grava o Pacote
    const { data: novoPacote, error: errPacote } = await supabaseAdmin
      .from('pacotes')
      .insert([pacoteData])
      .select()
      .single();

    if (errPacote) throw errPacote;

    // 2. Grava os Itens do Pacote (Hotel e Guia)
    const { error: errItens } = await supabaseAdmin
      .from('pacote_itens')
      .insert([{
        pacote_id: novoPacote.id,
        hotel_id: itensData.hotel_id,
        guia_id: itensData.guia_id
      }]);

    if (errItens) throw errItens;

    return NextResponse.json({ sucesso: true, pacote: novoPacote });
  } catch (error: any) {
    console.error("Erro na ponte segura de pacotes:", error);
    return NextResponse.json({ sucesso: false, error: error.message }, { status: 500 });
  }
}