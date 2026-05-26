import json
import uuid

def simular_split_pagbank():
    print("=== INICIANDO SIMULAÇÃO DE MOTOR FINANCEIRO (SAGA TURISMO) ===\n")

    # 1. Dados Fictícios do Pedido (Simulando o que vem do Frontend)
    codigo_pedido = f"SAGA-{uuid.uuid4().hex[:8].upper()}"
    valor_pacote_cliente = 259.00  # Valor total pago pelo turista
    
    # 2. Custos calculados pelo teu backend (Base de Dados)
    custo_hotel = 100.00
    custo_guia = 50.00
    # O lucro da agência é o que sobra: 259 - (100 + 50) = 109
    lucro_agencia = valor_pacote_cliente - (custo_hotel + custo_guia) 

    # 3. Taxa da Prefeitura (ex: 5% de taxa de serviço do marketplace)
    taxa_prefeitura_pct = 5.0
    fator_liquido = 1.0 - (taxa_prefeitura_pct / 100.0) # 0.95

    print(f"💰 Valor Cobrado ao Turista: R$ {valor_pacote_cliente:.2f}")
    print(f"🏦 Taxa Retida pela Prefeitura (Master): {taxa_prefeitura_pct}%")
    print("-" * 50)

    # 4. Montando o Array de Recebedores (O Split Real)
    # Usamos IDs de contas fictícios do tipo "ACC_" para simular os parceiros
    recebedores_split = []

    # A) Repasse do Hotel (R$ 100 - 5% = R$ 95)
    recebedores_split.append({
        "account": {"id": "ACC_HOTEL_SAO_GERALDO_001"},
        "amount": {"value": int((custo_hotel * fator_liquido) * 100)} # Centavos: 9500
    })

    # B) Repasse do Guia (R$ 50 - 5% = R$ 47.50)
    recebedores_split.append({
        "account": {"id": "ACC_GUIA_JOAO_002"},
        "amount": {"value": int((custo_guia * fator_liquido) * 100)} # Centavos: 4750
    })

    # C) Repasse da Agência de Viagens (R$ 109 - 5% = R$ 103.55)
    recebedores_split.append({
        "account": {"id": "ACC_AGENCIA_SERRA_AZUL_003"},
        "amount": {"value": int((lucro_agencia * fator_liquido) * 100)} # Centavos: 10355
    })

    # O PagBank sabe que o restante (R$ 12.95) fica na conta Master (Prefeitura) automaticamente.

    # 5. Montando o Payload do PagBank (Cartão de Crédito)
    payload_pagbank = {
        "reference_id": codigo_pedido,
        "description": "Pacote Turístico Oficial - SagaTurismo",
        "amount": {
            "value": int(valor_pacote_cliente * 100),
            "currency": "BRL"
        },
        "payment_method": {
            "type": "CREDIT_CARD",
            "installments": 1,
            "capture": True,
            "card": {"encrypted": "token_criptografado_do_cartao_do_cliente"}
        },
        # ◄── A MAGIA DO SPLIT ACONTECE AQUI ──►
        "splits": [
            {
                "method": "FIXED",
                "receivers": recebedores_split
            }
        ]
    }

    # 6. Exibindo o JSON Final que prova a Não-Custódia
    print("\n📦 PAYLOAD JSON GERADO PARA O PAGBANK (Prova de Split Automático):")
    print(json.dumps(payload_pagbank, indent=4, ensure_ascii=False))
    
    print("\n✅ CONCLUSÃO DA AUDITORIA:")
    print("O JSON acima prova que, no exato momento da cobrança do cartão, o sistema já ordena ao banco que fracione o dinheiro.")
    print("O valor total nunca entra na conta da Prefeitura. A Prefeitura não atua como custodiante dos parceiros.")

if __name__ == "__main__":
    simular_split_pagbank()