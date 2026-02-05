"""
Servidor FastAPI para BBTips com SQL Server
"""
from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone

# Importar módulos de banco de dados
from database import SQLServerConnection, BancaRepository, OperacaoRepository, ConfiguracaoRepository, PadraoRepository

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Inicializar conexão com SQL Server
sql_conn = SQLServerConnection()

# Inicializar repositórios
banca_repo = BancaRepository(sql_conn)
operacao_repo = OperacaoRepository(sql_conn)
config_repo = ConfiguracaoRepository(sql_conn)
padrao_repo = PadraoRepository(sql_conn)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== Pydantic Models ====================

class BancaCreate(BaseModel):
    Nome: str
    SaldoInicial: float
    StopLoss: float = 20
    StopGain: float = 30
    StakeBase: float = 10
    Estrategia: int = 2
    Mercado: int = 1
    Multiplicador: float = 2
    MaxGales: int = 3

class BancaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    Id: str
    Nome: str
    SaldoInicial: float
    SaldoAtual: float
    StopLoss: float
    StopGain: float
    StakeBase: float
    Estrategia: int
    Status: int
    Mercado: int
    DataCriacao: str | None = None
    DataUltimaOperacao: str | None = None
    Multiplicador: float
    MaxGales: int

class OperacaoCreate(BaseModel):
    BancaId: str
    Stake: float
    Odd: float
    Mercado: int
    Evento: str | None = None
    Liga: str | None = None
    Placar: str | None = None
    NumeroGale: int = 0
    Observacao: str | None = None

class OperacaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    Id: str
    BancaId: str
    PadraoId: str | None = None
    Stake: float
    Odd: float
    RetornoReal: float | None = None
    Status: int
    Mercado: int
    Evento: str | None = None
    Liga: str | None = None
    Placar: str | None = None
    PlacarFinal: str | None = None
    NumeroGale: int
    DataHora: str | None = None
    Observacao: str | None = None

class OperacaoUpdateStatus(BaseModel):
    Status: int
    RetornoReal: float | None = None

class ConfigBBTipsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    Id: int
    Email: str
    Senha: str | None = None
    UrlBase: str
    LembrarCredenciais: bool
    AutoLogin: bool
    TimeoutSegundos: int
    ModoDebug: bool

class ConfigBBTipsUpdate(BaseModel):
    Email: str
    Senha: str | None = None
    UrlBase: str = "https://app.bbtips.com.br"
    LembrarCredenciais: bool = False
    AutoLogin: bool = False
    TimeoutSegundos: int = 30
    ModoDebug: bool = False

class ConfigGeralResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    Id: int
    NotificacoesAtivas: bool
    SomAlerta: bool
    IntervaloAtualizacao: int
    TemaAplicacao: str
    IniciarComWindows: bool
    CaminhoBancoDados: str | None = None

class ConfigGeralUpdate(BaseModel):
    NotificacoesAtivas: bool = True
    SomAlerta: bool = True
    IntervaloAtualizacao: int = 5
    TemaAplicacao: str = "Dark"
    IniciarComWindows: bool = False
    CaminhoBancoDados: str | None = None

# ==================== Routes ====================

@api_router.get("/")
async def root():
    return {"message": "BBTips API com SQL Server", "status": "online"}

@api_router.get("/health")
async def health_check():
    """Verifica saúde do banco de dados"""
    return {
        "status": "healthy",
        "database": "SQL Server",
        "connected": sql_conn.test_connection()
    }

# --- Bancas ---

@api_router.get("/bancas", response_model=List[BancaResponse])
async def get_bancas():
    """Retorna todas as bancas"""
    bancas = banca_repo.get_all()
    return [BancaResponse(**b) for b in bancas]

@api_router.get("/bancas/{banca_id}", response_model=BancaResponse)
async def get_banca(banca_id: str):
    """Retorna uma banca pelo ID"""
    banca = banca_repo.get_by_id(banca_id)
    if banca is None:
        return {"error": "Banca não encontrada"}
    return BancaResponse(**banca)

@api_router.post("/bancas", response_model=BancaResponse)
async def create_banca(banca: BancaCreate):
    """Cria uma nova banca"""
    banca_data = BancaCreate.model_dump(banca)
    banca_id = banca_repo.create(banca_data)
    nova_banca = banca_repo.get_by_id(banca_id)
    return BancaResponse(**nova_banca)

@api_router.put("/bancas/{banca_id}", response_model=BancaResponse)
async def update_banca(banca_id: str, banca: BancaCreate):
    """Atualiza uma banca"""
    banca_data = BancaCreate.model_dump(banca)
    success = banca_repo.update(banca_id, banca_data)
    if not success:
        return {"error": "Banca não encontrada"}
    banca_atualizada = banca_repo.get_by_id(banca_id)
    return BancaResponse(**banca_atualizada)

@api_router.delete("/bancas/{banca_id}")
async def delete_banca(banca_id: str):
    """Exclui uma banca"""
    success = banca_repo.delete(banca_id)
    if not success:
        return {"error": "Banca não encontrada"}
    return {"message": "Banca excluída com sucesso"}

# --- Operações ---

@api_router.get("/bancas/{banca_id}/operacoes", response_model=List[OperacaoResponse])
async def get_operacoes(banca_id: str):
    """Retorna todas as operações de uma banca"""
    operacoes = operacao_repo.get_by_banca_id(banca_id)
    return [OperacaoResponse(**o) for o in operacoes]

@api_router.post("/operacoes", response_model=OperacaoResponse)
async def create_operacao(operacao: OperacaoCreate):
    """Cria uma nova operação"""
    operacao_data = OperacaoCreate.model_dump(operacao)
    operacao_id = operacao_repo.create(operacao_data)
    
    # Atualizar data da última operação da banca
    banca = banca_repo.get_by_id(operacao_data['BancaId'])
    if banca:
        banca['DataUltimaOperacao'] = datetime.now().isoformat()
        banca_repo.update(operacao_data['BancaId'], banca)
    
    nova_operacao = operacao_repo.get_by_banca_id(operacao_data['BancaId'])[0] if operacao_repo.get_by_banca_id(operacao_data['BancaId']) else None
    if nova_operacao:
        return OperacaoResponse(**nova_operacao)
    return OperacaoResponse(**operacao_data)

@api_router.put("/operacoes/{operacao_id}/status")
async def update_operacao_status(operacao_id: str, update: OperacaoUpdateStatus):
    """Atualiza o status de uma operação"""
    success = operacao_repo.update_status(operacao_id, update.Status, update.RetornoReal)
    if not success:
        return {"error": "Operação não encontrada"}
    return {"message": "Status atualizado com sucesso"}

# --- Configurações ---

@api_router.get("/config/bbtips", response_model=ConfigBBTipsResponse)
async def get_config_bbtips():
    """Retorna as configurações do BB Tips"""
    config = config_repo.get_bbtips_config()
    if config is None:
        return {"error": "Configuração não encontrada"}
    return ConfigBBTipsResponse(**config)

@api_router.put("/config/bbtips")
async def update_config_bbtips(config: ConfigBBTipsUpdate):
    """Atualiza as configurações do BB Tips"""
    config_data = ConfigBBTipsUpdate.model_dump(config)
    success = config_repo.update_bbtips_config(config_data)
    if not success:
        return {"error": "Falha ao atualizar configuração"}
    return {"message": "Configuração atualizada com sucesso"}

@api_router.get("/config/geral", response_model=ConfigGeralResponse)
async def get_config_geral():
    """Retorna as configurações gerais"""
    config = config_repo.get_geral_config()
    if config is None:
        return {"error": "Configuração não encontrada"}
    return ConfigGeralResponse(**config)

@api_router.put("/config/geral")
async def update_config_geral(config: ConfigGeralUpdate):
    """Atualiza as configurações gerais"""
    config_data = ConfigGeralUpdate.model_dump(config)
    success = config_repo.update_geral_config(config_data)
    if not success:
        return {"error": "Falha ao atualizar configuração"}
    return {"message": "Configuração atualizada com sucesso"}

# --- Padrões ---

@api_router.get("/padroes")
async def get_padroes(ativo: bool = True):
    """Retorna todos os padrões"""
    padroes = padrao_repo.get_all(ativo)
    return padroes

@api_router.post("/padroes")
async def create_padrao(padrao: dict):
    """Cria um novo padrão"""
    padrao_id = padrao_repo.create(padrao)
    return {"id": padrao_id, "message": "Padrão criado com sucesso"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection accepted")
    try:
        while True:
            msg = await websocket.receive_text()
            logger.info("WebSocket received message: %s", msg)
            # Here you can broadcast messages to connected clients
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
