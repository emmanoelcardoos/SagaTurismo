from fastapi import APIRouter, HTTPException
import os
from supabase import create_client, Client
from datetime import datetime

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@router.get("/api/v1/parceiros/{item_id}/reservas", tags=["Portal dos Parceiros"])
async def listar_reservas_parceiro(item_id: str):
    """
    Retorna todas as reservas PAGAS de um hotel, guia ou pacote específico.
    Utilizado para renderizar as tabelas de hóspedes e checklists no frontend.
    """
    try:
        # Consulta os pedidos filtrando pelo ID do parceiro e que estejam devidamente pagos
        res = supabase.table("pedidos") \
            .select("codigo_pedido, tipo_item, nome_cliente, email_cliente, telefone_cliente, quantidade, valor_total, data_checkin, data_checkout") \
            .eq("item_id", item_id) \
            .eq("status_pagamento", "pago") \
            .execute()
            
        return {
            "sucesso": True,
            "total_reservas": len(res.data),
            "reservas": res.data
        }
    except Exception as e:
        print(f"[ERRO PORTAL PARCEIROS] {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar lista de reservas do parceiro.")


@router.get("/api/v1/parceiros/{item_id}/dashboard", tags=["Portal dos Parceiros"])
async def obter_metricas_dashboard(item_id: str):
    """
    Retorna métricas consolidadas (Faturamento total, total de clientes, etc)
    para alimentar os cartões de resumo e gráficos do Portal do Parceiro.
    """
    try:
        res = supabase.table("pedidos") \
            .select("valor_total, quantidade, data_checkin") \
            .eq("item_id", item_id) \
            .eq("status_pagamento", "pago") \
            .execute()
            
        pedidos = res.data
        
        # Cálculos matemáticos em cima dos dados reais do Supabase
        faturamento_total = sum(float(p.get("valor_total", 0.0)) for p in pedidos)
        total_itens_vendidos = sum(int(p.get("quantidade", 1)) for p in pedidos)
        
        # Filtrar check-ins futuros (atendimento pendente)
        hoje = datetime.now().date()
        proximos_clientes = 0
        for p in pedidos:
            data_checkin_str = p.get("data_checkin")
            if data_checkin_str:
                try:
                    data_checkin = datetime.strptime(data_checkin_str, "%Y-%m-%d").date()
                    if data_checkin >= hoje:
                        proximos_clientes += 1
                except ValueError:
                    pass

        return {
            "sucesso": True,
            "metricas": {
                "faturamento_total": faturamento_total,
                "total_vendas": len(pedidos),
                "total_produtos_entregues": total_itens_vendidos,
                "clientes_a_chegar": proximos_clientes
            }
        }
    except Exception as e:
        print(f"[ERRO METRICAS PARCEIROS] {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar métricas do dashboard.")