from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import residentes, fiscal

app = FastAPI(title="API Cartão Residente - São Geraldo do Araguaia")

# --- CONFIGURAÇÃO DO CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ----------------------------

app.include_router(residentes.router, prefix="/api/v1")
app.include_router(fiscal.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"mensagem": "API do Cartão Residente operacional!"}