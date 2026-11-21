import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 1. IMPORTAÇÃO DAS ROTAS (Incluindo Administração de Residentes e Suporte)
from app.routes import (
    residentes,
    fiscal,
    pagamentos,
    webhooks,
    validacao,
    parceiros,
    notificacoes,
    suporte,
    admin_residentes,
)
from app.services.expiracao_service import executar_rotina_expiracao_carteiras


async def _loop_expiracao_carteiras():
    """Executa a rotina de expiração de carteiras (365 dias) automaticamente a cada 24 horas."""
    intervalo = int(os.getenv("EXPIRACAO_INTERVAL_SECONDS", "86400"))
    atraso_inicial = int(os.getenv("EXPIRACAO_INITIAL_DELAY_SECONDS", "60"))
    try:
        await asyncio.sleep(atraso_inicial)
        while True:
            try:
                await asyncio.to_thread(executar_rotina_expiracao_carteiras, False, "sistema:rotina_24h")
            except Exception as exc:
                print(f"[SCHEDULER EXPIRAÇÃO] Erro na execução periódica: {exc}")
            await asyncio.sleep(intervalo)
    except asyncio.CancelledError:
        print("[SCHEDULER EXPIRAÇÃO] Encerrado graciosamente.")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    task = None
    if os.getenv("ENABLE_EXPIRACAO_SCHEDULER", "true").lower() == "true":
        task = asyncio.create_task(_loop_expiracao_carteiras())
    try:
        yield
    finally:
        if task:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass


app = FastAPI(title="API SagaTurismo - São Geraldo do Araguaia", lifespan=lifespan)

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

# 2. INCLUSÃO DAS ROTAS FINANCEIRAS, VALIDAÇÃO, PARCEIROS, NOTIFICAÇÕES, ADMIN E SUPORTE
app.include_router(pagamentos.router, tags=["Financeiro"])
app.include_router(webhooks.router, tags=["Webhooks"])
app.include_router(validacao.router, tags=["Validação de Documentos"])
app.include_router(parceiros.router, tags=["Portal dos Parceiros"])
app.include_router(notificacoes.router, tags=["Notificações"]) 
app.include_router(admin_residentes.router)

# ◄── NOVA ROTA ADICIONADA AQUI: Help Desk / Atendimento ao Cidadão
app.include_router(suporte.router, prefix="/api/v1", tags=["Suporte e Atendimento"])

@app.get("/")
def read_root():
    return {"mensagem": "API do SagaTurismo operacional, integrada com PagBank e pronta para Parceiros e Suporte!"}