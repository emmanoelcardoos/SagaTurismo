import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const { pedidoId, valorReembolso, asaasPaymentId } = await request.json();

    if (!pedidoId || !asaasPaymentId) {
      return NextResponse.json({ sucesso: false, error: "Dados insuficientes (Falta ID do Pedido ou Asaas)." }, { status: 400 });
    }

    // Vamos garantir que o valor vai limpo, com 2 casas decimais matemáticas (ex: 134.00)
    // Pega o valor total bruto da tabela pedidos em vez de descontar a taxa por enquanto
    const { data: pedidoAtual } = await supabaseAdmin
      .from('pedidos')
      .select('valor_total')
      .eq('id', pedidoId)
      .single();

    const valorTotalBruto = pedidoAtual?.valor_total || valorReembolso;
    const valorFormatado = Number(valorTotalBruto).toFixed(2);

    console.log(`[CANCELAMENTO] A tentar estornar o VALOR TOTAL de R$ ${valorFormatado} para a cobrança: ${asaasPaymentId}`);

    const asaasResponse = await fetch(`https://sandbox.asaas.com/api/v3/payments/${asaasPaymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': process.env.ASAAS_API_KEY!
      },
      body: JSON.stringify({
        value: Number(valorFormatado),
        description: "Cancelamento solicitado pelo turista via Portal Minha Reserva."
      })
    });

    const asaasData = await asaasResponse.json();

    if (!asaasResponse.ok) {
       console.error("Erro detalhado do Asaas:", asaasData);
       const mensagemErro = asaasData.errors?.[0]?.description || "O banco recusou o estorno.";
       return NextResponse.json({ sucesso: false, error: mensagemErro }, { status: 400 });
    }

    // Atualiza o status na Base de Dados para "cancelado"
    const { error: updateError } = await supabaseAdmin
      .from('pedidos')
      .update({ status_pagamento: 'cancelado' })
      .eq('id', pedidoId);

    if (updateError) throw updateError;

    return NextResponse.json({ sucesso: true, mensagem: "Reserva cancelada e reembolsada com sucesso." });
    
  } catch (error: any) {
    console.error("Erro crítico ao cancelar reserva:", error);
    return NextResponse.json({ sucesso: false, error: error.message || "Erro interno no servidor." }, { status: 500 });
  }
}