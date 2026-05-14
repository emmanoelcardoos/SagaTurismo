from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 1. IMPORTAÇÃO DAS NOVAS ROTAS (pagamentos e webhooks)
from app.routes import residentes, fiscal, pagamentos, webhooks

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

# 2. INCLUSÃO DAS ROTAS FINANCEIRAS
# Nota: Não usamos prefix="/api/v1" aqui porque você já colocou 
# a rota completa ("/api/v1/pagamentos/processar") dentro dos próprios ficheiros.
app.include_router(pagamentos.router, tags=["Financeiro"])
app.include_router(webhooks.router, tags=["Webhooks"])

@app.get("/")
def read_root():
    return {"mensagem": "API do SagaTurismo operacional e integrada com PagBank!"}