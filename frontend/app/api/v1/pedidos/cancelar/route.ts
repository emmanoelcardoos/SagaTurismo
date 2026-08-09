import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usamos a chave secreta (Service Role) para poder editar a base de dados com segurança
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const { pedidoId, valorReembolso, asaasPaymentId } = await request.json();

    // 1. Validação de Segurança Básica
    if (!pedidoId) {
      return NextResponse.json({ sucesso: false, error: "ID do pedido não fornecido." }, { status: 400 });
    }

    // 2. Comunicar com o ASAAS para Estornar (Reembolso Parcial ou Total)
    // NOTA: Para isto funcionar na vida real, precisas de ter o ID da cobrança do Asaas guardado na tua tabela pedidos (ex: 'pay_0123456789')
    /* 
    const asaasResponse = await fetch(`https://api.asaas.com/v3/payments/${asaasPaymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': process.env.ASAAS_API_KEY!
      },
      body: JSON.stringify({
        value: valorReembolso, // Estorna apenas o valor sem a taxa da plataforma
        description: "Cancelamento solicitado pelo turista via Portal Minha Reserva."
      })
    });

    if (!asaasResponse.ok) {
       const asaasError = await asaasResponse.json();
       throw new Error("Erro no Asaas: " + JSON.stringify(asaasError));
    }
    */
    
    // Simulando o delay do Asaas para testes
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 3. Atualizar o status na Base de Dados para "cancelado"
    const { error: updateError } = await supabaseAdmin
      .from('pedidos')
      .update({ status_pagamento: 'cancelado' })
      .eq('id', pedidoId);

    if (updateError) throw updateError;

    // 4. Se for hotel/passeio, poderíamos também libertar a vaga na tabela de disponibilidade aqui.

    return NextResponse.json({ sucesso: true, mensagem: "Reserva cancelada e reembolsada com sucesso." });
    
  } catch (error: any) {
    console.error("Erro ao cancelar reserva:", error);
    return NextResponse.json({ sucesso: false, error: error.message }, { status: 500 });
  }
}