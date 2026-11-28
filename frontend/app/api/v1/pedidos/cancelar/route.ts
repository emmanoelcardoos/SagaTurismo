import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const ASAAS_API_URL = (process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3').replace(/\/$/, '');

export async function POST(request: Request) {
  try {
    const { pedidoId, codigoPedido, cpf } = await request.json();
    const cpfLimpo = String(cpf || '').replace(/\D/g, '');

    if (!pedidoId || !codigoPedido || cpfLimpo.length !== 11) {
      return NextResponse.json({ sucesso: false, error: "Dados insuficientes para validar a reserva." }, { status: 400 });
    }

    // Segurança: todos os dados do estorno vêm da BASE DE DADOS, nunca do navegador.
    // O turista prova a titularidade com o código da reserva + CPF (mesma regra da consulta).
    const { data: pedidoAtual } = await supabaseAdmin
      .from('pedidos')
      .select('id, codigo_pedido, cpf_cliente, valor_total, status_pagamento, asaas_payment_id')
      .eq('id', pedidoId)
      .maybeSingle();

    const cpfPedido = String(pedidoAtual?.cpf_cliente || '').replace(/\D/g, '');
    if (!pedidoAtual || pedidoAtual.codigo_pedido !== codigoPedido || cpfPedido !== cpfLimpo) {
      return NextResponse.json({ sucesso: false, error: "Reserva não encontrada." }, { status: 404 });
    }
    if (pedidoAtual.status_pagamento !== 'pago') {
      return NextResponse.json({ sucesso: false, error: "Apenas reservas pagas podem ser canceladas com reembolso." }, { status: 400 });
    }
    if (!pedidoAtual.asaas_payment_id) {
      return NextResponse.json({ sucesso: false, error: "Esta reserva não possui cobrança Asaas associada." }, { status: 400 });
    }

    const valorFormatado = Number(pedidoAtual.valor_total).toFixed(2);

    console.log(`[CANCELAMENTO] A tentar estornar o VALOR TOTAL de R$ ${valorFormatado} para a cobrança: ${pedidoAtual.asaas_payment_id}`);

    const asaasResponse = await fetch(`${ASAAS_API_URL}/payments/${encodeURIComponent(pedidoAtual.asaas_payment_id)}/refund`, {
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

    // Atualiza o status na Base de Dados para "cancelado" (só se ainda estiver pago)
    const { error: updateError } = await supabaseAdmin
      .from('pedidos')
      .update({ status_pagamento: 'cancelado' })
      .eq('id', pedidoAtual.id)
      .eq('status_pagamento', 'pago');

    if (updateError) throw updateError;

    return NextResponse.json({ sucesso: true, mensagem: "Reserva cancelada e reembolsada com sucesso." });

  } catch (error: any) {
    console.error("Erro crítico ao cancelar reserva:", error);
    return NextResponse.json({ sucesso: false, error: "Erro interno no servidor." }, { status: 500 });
  }
}
