from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 1. IMPORTAÇÃO DAS ROTAS (Incluindo agora o SUPORTE)
from app.routes import residentes, fiscal, pagamentos, webhooks, validacao, parceiros, notificacoes, suporte

app = FastAPI(title="API SagaTurismo - São Geraldo do Araguaia")

# --- CONFIGURAÇÃO DO CORS ---
# ◄── BLINDAGEM DE SEGURANÇA: Apenas estes domínios podem aceder à API
origens_permitidas = [
    "http://localhost:3000",             # Para continuares a testar localmente no teu PC
    "https://saga-turismo.vercel.app",   # O teu link antigo da Vercel
    "https://sagatur.com.br",            # O TEU NOVO DOMÍNIO OFICIAL
    "https://www.sagatur.com.br",
    "https://turismo.saogeraldodoaraguaia.pa.gov.br"     
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origens_permitidas,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ----------------------------

# Rotas Originais
app.include_router(residentes.router, prefix="/api/v1")
app.include_router(fiscal.router, prefix="/api/v1")

# 2. INCLUSÃO DAS ROTAS FINANCEIRAS, VALIDAÇÃO, PARCEIROS, NOTIFICAÇÕES E SUPORTE
app.include_router(pagamentos.router, tags=["Financeiro"])
app.include_router(webhooks.router, tags=["Webhooks"])
app.include_router(validacao.router, tags=["Validação de Documentos"])
app.include_router(parceiros.router, tags=["Portal dos Parceiros"])
app.include_router(notificacoes.router, tags=["Notificações"]) 

# ◄── NOVA ROTA ADICIONADA AQUI: Help Desk / Atendimento ao Cidadão
app.include_router(suporte.router, prefix="/api/v1", tags=["Suporte e Atendimento"])

@app.get("/")
def read_root():
    return {"mensagem": "API do SagaTurismo operacional, integrada com PagBank e pronta para Parceiros e Suporte!"}