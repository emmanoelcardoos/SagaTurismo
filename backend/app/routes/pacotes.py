from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from supabase import create_client, Client

router = APIRouter()

# Conexão com o Supabase
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

@router.get("/api/v1/pacotes/{pacote_id}")
async def obter_detalhes_pacote(pacote_id: str):
    try:
        # 1. Busca os dados principais do Pacote (a "Capa")
        pacote_res = supabase.table("pacotes").select("*").eq("id", pacote_id).single().execute()
        if not pacote_res.data:
            raise HTTPException(status_code=404, detail="Pacote não encontrado")
        
        pacote = pacote_res.data
        
        # 2. Busca os Itens que pertencem a este pacote
        itens_res = supabase.table("pacote_itens").select("*").eq("pacote_id", pacote_id).execute()
        itens = itens_res.data

        # Variáveis para construirmos o resultado final e somarmos o preço
        valor_total = 0.0
        hoteis_inclusos = []
        guias_inclusos = []
        atracoes_inclusas = []

        # 3. Varre os itens e vai buscar os detalhes em cada tabela
        for item in itens:
            if item.get("hotel_id"):
                hotel_res = supabase.table("hoteis").select("id, nome, preco_medio, imagem_url").eq("id", item["hotel_id"]).single().execute()
                if hotel_res.data:
                    hoteis_inclusos.append(hotel_res.data)
                    valor_total += float(hotel_res.data.get("preco_medio", 0))

            elif item.get("guia_id"):
                guia_res = supabase.table("guias").select("id, nome, especialidade, preco_diaria, imagem_url").eq("id", item["guia_id"]).single().execute()
                if guia_res.data:
                    guias_inclusos.append(guia_res.data)
                    valor_total += float(guia_res.data.get("preco_diaria", 0))

            elif item.get("atracao_id"):
                atracao_res = supabase.table("atracoes").select("id, nome, tipo, preco_entrada, imagem_url").eq("id", item["atracao_id"]).single().execute()
                if atracao_res.data:
                    atracoes_inclusas.append(atracao_res.data)
                    valor_total += float(atracao_res.data.get("preco_entrada", 0))

        # 4. Monta o JSON Perfeito para o seu Next.js
        resultado_final = {
            "id": pacote["id"],
            "titulo": pacote["titulo"],
            "descricao_curta": pacote["descricao_curta"],
            "imagem_principal": pacote["imagem_principal"],
            "dias": pacote["dias"],
            "noites": pacote["noites"],
            "valor_total_pacote": round(valor_total, 2),
            "servicos": {
                "hoteis": hoteis_inclusos,
                "guias": guias_inclusos,
                "atracoes": atracoes_inclusas
            }
        }

        return resultado_final

    except Exception as e:
        print(f"Erro ao buscar pacote: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")