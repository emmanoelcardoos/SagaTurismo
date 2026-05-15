from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 1. IMPORTAÇÃO DAS ROTAS (Incluindo a rota de validação e a nova de parceiros)
from app.routes import residentes, fiscal, pagamentos, webhooks, validacao,正式 parceiros

app = FastAPI(title="API SagaTurismo - São Geraldo do Araguaia")

# --- CONFIGURAÇÃO DO CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permite que a Vercel acesse a API
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ----------------------------

# Rotas Originais
app.include_router(residentes.router, prefix="/api/v1")
app.include_router(fiscal.router, prefix="/api/v1")

# 2. INCLUSÃO DAS ROTAS FINANCEIRAS, VALIDAÇÃO E PARCEIROS
# Nota: Não usamos prefix="/api/v1" aqui porque já definimos
# as rotas completas dentro dos próprios ficheiros.
app.include_router(pagamentos.router, tags=["Financeiro"])
app.include_router(webhooks.router, tags=["Webhooks"])
app.include_router(validacao.router, tags=["Validação de Documentos"])
app.include_router(parceiros.router, tags=["Portal dos Parceiros"])

@app.get("/")
def read_root():
    return {"mensagem": "API do SagaTurismo operacional, integrada com PagBank e pronta para Parceiros!"}