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

# Importar modulos de banco de dados
from database import SQLServerConnection, BancaRepository, OperacaoRepository, ConfiguracaoRepository, PadraoRepository, CredencialBBTipsRepository

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Inicializar conexao com SQL Server
sql_conn = SQLServerConnection()

# Inicializar repositorios
banca_repo = BancaRepository(sql_conn)
operacao_repo = OperacaoRepository(sql_conn)
config_repo = ConfiguracaoRepository(sql_conn)
padrao_repo = PadraoRepository(sql_conn)
credencial_repo = CredencialBBTipsRepository(sql_conn)

# Create the main app without a prefix
app = FastAPI()

@app.get("/")
async def root():
    return {"message": "BBTips API com SQL Server", "status": "online", "docs": "/docs"}

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== Pydantic Models ====================

class CredencialBBTipsCreate(BaseModel):
    Nome: str
    Email: str
    Senha: str | None = None
    UrlBase: str = "https://app.bbtips.com.br"
    TimeoutSegundos: int = 30
    ModoDebug: bool = False
    EhPrincipal: bool = False
    Ativa: bool = True

class CredencialBBTipsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    Id: str
    Nome: str
    Email: str
    Senha: str | None = None
    UrlBase: str
    TimeoutSegundos: int
    ModoDebug: bool
    EhPrincipal: bool
    Ativa: bool
    DataCriacao: str | None = None
    DataAtualizacao: str | None = None

class CredencialBBTipsUpdate(BaseModel):
    Nome: str
    Email: str
    Senha: str | None = None
    UrlBase: str = "https://app.bbtips.com.br"
    TimeoutSegundos: int = 30
    ModoDebug: bool = False
    EhPrincipal: bool = False
    Ativa: bool = True

class BancaCreate(BaseModel):
    Nome: str
    SaldoInicial: float
    StopLoss: float = 20
    StopGain: float = 30
    StakeBase: float = 10
    StakePercent: float = 2
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
    StakePercent: float | None = None
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

class ConfigGeralResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    Id: int
    NotificacoesAtivas: bool
    SomAlerta: bool
    IntervaloAtualizacao: int
    TemaAplicacao: str
    IniciarComWindows: bool
    CaminhoBancoDados: str | None = None
    CredencialBBTipsId: str | None = None

class ConfigGeralUpdate(BaseModel):
    NotificacoesAtivas: bool = True
    SomAlerta: bool = True
    IntervaloAtualizacao: int = 5
    TemaAplicacao: str = "Dark"
    IniciarComWindows: bool = False
    CaminhoBancoDados: str | None = None
    CredencialBBTipsId: str | None = None

# ==================== Routes ====================

@api_router.get("/")
async def root():
    return {"message": "BBTips API com SQL Server", "status": "online"}

@api_router.get("/health")
async def health_check():
    """Verifica saude do backend e banco de dados"""
    import logging
    logger = logging.getLogger(__name__)
    
    sql_connected = False
    sql_error = None
    
    try:
        sql_connected = sql_conn.test_connection()
        logger.info(f"Health check - SQL connected: {sql_connected}")
    except Exception as e:
        sql_error = str(e)
        logger.error(f"Health check - SQL error: {e}")
    
    return {
        "status": "online" if sql_connected else "degraded",
        "backend": "online",
        "database": "SQL Server",
        "sql_connected": sql_connected,
        "sql_error": sql_error
    }

# --- Credenciais BB Tips ---

@api_router.get("/credenciais", response_model=List[CredencialBBTipsResponse])
async def get_credenciais():
    """Retorna todas as credenciais BB Tips"""
    credenciais = credencial_repo.get_all()
    return [CredencialBBTipsResponse(**c) for c in credenciais]

@api_router.get("/credenciais/{credencial_id}", response_model=CredencialBBTipsResponse)
async def get_credencial(credencial_id: str):
    """Retorna uma credencial pelo ID"""
    credencial = credencial_repo.get_by_id(credencial_id)
    if credencial is None:
        return {"error": "Credencial nao encontrada"}
    return CredencialBBTipsResponse(**credencial)

@api_router.get("/credenciais/principal", response_model=CredencialBBTipsResponse)
async def get_credencial_principal():
    """Retorna a credencial principal"""
    credencial = credencial_repo.get_principal()
    if credencial is None:
        return {"error": "Nenhuma credencial principal encontrada"}
    return CredencialBBTipsResponse(**credencial)

@api_router.post("/credenciais", response_model=CredencialBBTipsResponse)
async def create_credencial(credencial: CredencialBBTipsCreate):
    """Cria uma nova credencial"""
    credencial_data = CredencialBBTipsCreate.model_dump(credencial)
    credencial_id = credencial_repo.create(credencial_data)
    nova_credencial = credencial_repo.get_by_id(credencial_id)
    return CredencialBBTipsResponse(**nova_credencial)

@api_router.put("/credenciais/{credencial_id}", response_model=CredencialBBTipsResponse)
async def update_credencial(credencial_id: str, credencial: CredencialBBTipsUpdate):
    """Atualiza uma credencial"""
    credencial_data = CredencialBBTipsUpdate.model_dump(credencial)
    success = credencial_repo.update(credencial_id, credencial_data)
    if not success:
        return {"error": "Credencial nao encontrada"}
    credencial_atualizada = credencial_repo.get_by_id(credencial_id)
    return CredencialBBTipsResponse(**credencial_atualizada)

@api_router.delete("/credenciais/{credencial_id}")
async def delete_credencial(credencial_id: str):
    """Exclui uma credencial"""
    success = credencial_repo.delete(credencial_id)
    if not success:
        return {"error": "Credencial nao encontrada ou é a única credencial"}
    return {"message": "Credencial excluida com sucesso"}

@api_router.post("/credenciais/{credencial_id}/definir-principal")
async def definir_credencial_principal(credencial_id: str):
    """Define uma credencial como principal"""
    success = credencial_repo.set_principal(credencial_id)
    if not success:
        return {"error": "Credencial nao encontrada"}
    return {"message": "Credencial definida como principal com sucesso"}

# --- Endpoints de compatibilidade com ConfiguracaoBBTips antiga ---

class ConfigBBTipsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    Id: str
    Email: str
    Senha: str | None = None
    UrlBase: str
    LembrarCredenciais: bool = False
    AutoLogin: bool = False
    TimeoutSegundos: int = 30
    ModoDebug: bool = False

class ConfigBBTipsUpdate(BaseModel):
    Email: str
    Senha: str | None = None
    UrlBase: str = "https://app.bbtips.com.br"
    LembrarCredenciais: bool = False
    AutoLogin: bool = False
    TimeoutSegundos: int = 30
    ModoDebug: bool = False

@api_router.get("/config/bbtips", response_model=ConfigBBTipsResponse)
async def get_config_bbtips():
    """Retorna as configuracoes do BB Tips (usa credencial principal)"""
    credencial = credencial_repo.get_principal()
    if credencial is None:
        # Retorna estrutura vazia para compatibilidade
        return {
            "Id": "",
            "Email": "",
            "Senha": None,
            "UrlBase": "https://app.bbtips.com.br",
            "LembrarCredenciais": False,
            "AutoLogin": False,
            "TimeoutSegundos": 30,
            "ModoDebug": False
        }
    
    # Mapeia para o formato antigo
    return {
        "Id": credencial["Id"],
        "Email": credencial["Email"],
        "Senha": credencial["Senha"],
        "UrlBase": credencial["UrlBase"],
        "LembrarCredenciais": False,
        "AutoLogin": False,
        "TimeoutSegundos": credencial["TimeoutSegundos"],
        "ModoDebug": credencial["ModoDebug"]
    }

@api_router.put("/config/bbtips")
async def update_config_bbtips(config: ConfigBBTipsUpdate):
    """Atualiza as configuracoes do BB Tips (salva na credencial principal)"""
    # Busca ou cria credencial principal
    credencial = credencial_repo.get_principal()
    
    credencial_data = {
        "Nome": "BB Tips",
        "Email": config.Email,
        "Senha": config.Senha,
        "UrlBase": config.UrlBase,
        "TimeoutSegundos": config.TimeoutSegundos,
        "ModoDebug": config.ModoDebug,
        "EhPrincipal": True,
        "Ativa": True
    }
    
    if credencial is not None:
        # Atualiza a credencial existente
        credencial_repo.update(credencial["Id"], credencial_data)
    else:
        # Cria nova credencial
        credencial_repo.create(credencial_data)
    
    return {"message": "Configuracao atualizada com sucesso"}

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
        return {"error": "Banca nao encontrada"}
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
        return {"error": "Banca nao encontrada"}
    banca_atualizada = banca_repo.get_by_id(banca_id)
    return BancaResponse(**banca_atualizada)

@api_router.delete("/bancas/{banca_id}")
async def delete_banca(banca_id: str):
    """Exclui uma banca"""
    success = banca_repo.delete(banca_id)
    if not success:
        return {"error": "Banca nao encontrada"}
    return {"message": "Banca excluida com sucesso"}

# --- Operacoes ---

@api_router.get("/bancas/{banca_id}/operacoes", response_model=List[OperacaoResponse])
async def get_operacoes(banca_id: str):
    """Retorna todas as operacoes de uma banca"""
    operacoes = operacao_repo.get_by_banca_id(banca_id)
    return [OperacaoResponse(**o) for o in operacoes]

@api_router.post("/operacoes", response_model=OperacaoResponse)
async def create_operacao(operacao: OperacaoCreate):
    """Cria uma nova operacao"""
    operacao_data = OperacaoCreate.model_dump(operacao)
    operacao_id = operacao_repo.create(operacao_data)
    
    # Atualizar data da ultima operacao da banca
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
    """Atualiza o status de uma operacao"""
    success = operacao_repo.update_status(operacao_id, update.Status, update.RetornoReal)
    if not success:
        return {"error": "Operacao nao encontrada"}
    return {"message": "Status atualizado com sucesso"}

# --- Configuracoes ---

@api_router.get("/config/geral", response_model=ConfigGeralResponse)
async def get_config_geral():
    """Retorna as configuracoes gerais"""
    config = config_repo.get_geral_config()
    if config is None:
        return {"error": "Configuracao nao encontrada"}
    return ConfigGeralResponse(**config)

@api_router.put("/config/geral")
async def update_config_geral(config: ConfigGeralUpdate):
    """Atualiza as configuracoes gerais"""
    config_data = ConfigGeralUpdate.model_dump(config)
    success = config_repo.update_geral_config(config_data)
    if not success:
        return {"error": "Falha ao atualizar configuracao"}
    return {"message": "Configuracao atualizada com sucesso"}

# --- Padroes ---

@api_router.get("/padroes")
async def get_padroes(ativo: bool = True):
    """Retorna todos os padroes"""
    padroes = padrao_repo.get_all(ativo)
    return padroes

@api_router.post("/padroes")
async def create_padrao(padrao: dict):
    """Cria um novo padrao"""
    padrao_id = padrao_repo.create(padrao)
    return {"id": padrao_id, "message": "Padrao criado com sucesso"}

# ============ Endpoints do Robô ============

# Modelo de requisição para iniciar robô
class RoboStartRequest(BaseModel):
    CredencialId: str
    IntervaloVerificacao: int = 30
    ModoDebug: bool = False

@api_router.post("/robo/iniciar")
async def iniciar_robo(request: RoboStartRequest):
    """Inicia o robô de automação BB Tips"""
    # Busca credencial no banco
    credencial = credencial_repo.get_by_id(request.CredencialId)
    if credencial is None:
        return {"error": "Credencial não encontrada"}
    
    config = RoboConfig(
        credencial_id=credencial["Id"],
        email=credencial["Email"],
        senha=credencial["Senha"] or "",
        url_base=credencial["UrlBase"],
        intervalo_verificacao=request.IntervaloVerificacao,
        modo_debug=request.ModoDebug
    )
    
    ws_manager.start_robo(config)
    
    # Inicia o robô em background
    asyncio.create_task(ws_manager.robo.iniciar())
    
    return {
        "message": "Robô iniciado com sucesso",
        "status": "running",
        "config": {
            "email": config.email,
            "url_base": config.url_base,
            "intervalo": config.intervalo_verificacao
        }
    }

@api_router.post("/robo/parar")
async def parar_robo():
    """Para o robô de automação"""
    if ws_manager.robo:
        ws_manager.stop_robo()
        return {"message": "Robô parado com sucesso", "status": "stopped"}
    return {"message": "Robô não está em execução", "status": "already_stopped"}

@api_router.get("/robo/status")
async def get_robo_status():
    """Retorna status atual do robô"""
    return ws_manager.get_robo_status()

@api_router.get("/robo/logs")
async def get_robo_logs(limit: int = 100):
    """Retorna logs do robô"""
    if ws_manager.robo is None:
        return {"logs": []}
    return {"logs": ws_manager.robo.get_logs(limit)}

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

# Inicializar gerenciador do robô
from robo_bbtips import BBTipsRobo, RoboConfig, WebSocketManager, LogEntry
import asyncio
import json

ws_manager = WebSocketManager()


# WebSocket endpoint for real-time updates and logs
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection accepted")
    
    # Adiciona conexão ao gerenciador
    ws_manager.connections.add(websocket)
    
    # Envia logs atuais se robô estiver rodando
    if ws_manager.robo and ws_manager.robo.logs:
        for log in ws_manager.robo.logs[-20:]:  # Últimos 20 logs
            await websocket.send_text(json.dumps({
                "type": "log",
                "data": {
                    "timestamp": log.timestamp,
                    "level": log.level,
                    "message": log.message,
                    "source": log.source,
                    "details": log.details
                }
            }))
    
    try:
        while True:
            msg = await websocket.receive_text()
            logger.info("WebSocket received message: %s", msg)
            
            # Responde com ping
            await websocket.send_text(json.dumps({"type": "ping"}))
            
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
        ws_manager.connections.discard(websocket)
