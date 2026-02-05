"""
Robô de Automação BB Tips
 Faz scraping/login no sistema BB Tips e executa estratégias
"""
import asyncio
import aiohttp
import json
import os
from datetime import datetime
from typing import Optional, Callable, List, Dict, Any
from dataclasses import dataclass, field
from enum import Enum
import logging

logger = logging.getLogger(__name__)

# Diretório para screenshots
SCREENSHOT_DIR = r"c:\temp\bbtips_screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

class LogLevel(Enum):
    INFO = "INFO"
    SUCCESS = "SUCCESS"
    WARNING = "WARNING"
    ERROR = "ERROR"
    DEBUG = "DEBUG"

@dataclass
class LogEntry:
    timestamp: str
    level: str
    message: str
    source: str = "RoboBBTips"
    details: Optional[str] = None

@dataclass
class RoboConfig:
    credencial_id: str
    email: str
    senha: str
    url_base: str = "https://app.bbtips.com.br"
    intervalo_verificacao: int = 30  # segundos
    estrategias_ativas: List[str] = field(default_factory=list)
    modo_debug: bool = False

class BBTipsRobo:
    """Robô de automação para BB Tips"""
    
    def __init__(self, config: RoboConfig):
        self.config = config
        self.session: Optional[aiohttp.ClientSession] = None
        self.browser = None
        self.page = None
        self.is_running = False
        self.log_callback: Optional[Callable[[LogEntry], None]] = None
        self.logs: List[LogEntry] = []
        
    def _generate_filename(self, step: str) -> str:
        """Gera nome do arquivo de screenshot"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return os.path.join(SCREENSHOT_DIR, f"{step}_{timestamp}.png")
    
    async def _take_screenshot(self, step: str, message: str):
        """Tira um screenshot da página e salva em c:\temp\bbtips_screenshots"""
        try:
            if self.page:
                filename = self._generate_filename(step)
                await self.page.screenshot(path=filename, full_page=True)
                self._add_log(LogLevel.INFO, f"📸 Screenshot salvo: {filename}")
                return filename
        except Exception as e:
            self._add_log(LogLevel.WARNING, f"⚠️ Não foi possível tirar screenshot: {str(e)}")
        return None
    
    def set_log_callback(self, callback: Callable[[LogEntry], None]):
        """Define callback para receber logs em tempo real"""
        self.log_callback = callback
        
    def _add_log(self, level: LogLevel, message: str, details: str = None):
        """Adiciona um log e notifica o callback"""
        entry = LogEntry(
            timestamp=datetime.now().isoformat(),
            level=level.value,
            message=message,
            details=details
        )
        self.logs.append(entry)
        if len(self.logs) > 1000:  # Mantém apenas últimos 1000 logs
            self.logs = self.logs[-1000:]
        if self.log_callback:
            try:
                self.log_callback(entry)
            except Exception as e:
                logger.error(f"Erro no callback de log: {e}")
        logger.info(f"[{level.value}] {message}")
        
    async def iniciar(self):
        """Inicia o robô"""
        self.is_running = True
        self._add_log(LogLevel.INFO, "🤖 Robô BB Tips iniciado", f"Email: {self.config.email}")
        self._add_log(LogLevel.INFO, "⚙️ Configurações carregadas", 
                     f"Intervalo: {self.config.intervalo_verificacao}s, Debug: {self.config.modo_debug}")
        self._add_log(LogLevel.INFO, f"📁 Screenshots serão salvos em: {SCREENSHOT_DIR}")
        
        # Criar sessão HTTP
        self._add_log(LogLevel.INFO, "🔌 Criando sessão HTTP...")
        self.session = aiohttp.ClientSession()
        self._add_log(LogLevel.SUCCESS, "✅ Sessão HTTP criada com sucesso")
        
        # Iniciar browser para screenshots
        try:
            from playwright.async_api import async_playwright
            self._add_log(LogLevel.INFO, "🌐 Inicializando browser (Playwright)...")
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(headless=True)
            self.page = await self.browser.new_page()
            self._add_log(LogLevel.SUCCESS, "✅ Browser inicializado com sucesso")
        except ImportError:
            self._add_log(LogLevel.WARNING, "⚠️ Playwright não instalado. Screenshots não serão disponíveis.")
            self._add_log(LogLevel.INFO, "💡 Instale com: pip install playwright && playwright install")
        except Exception as e:
            self._add_log(LogLevel.WARNING, f"⚠️ Erro ao inicializar browser: {str(e)}")
        
        try:
            await self._executar_loop_principal()
        except Exception as e:
            self._add_log(LogLevel.ERROR, f"💥 Erro crítico: {str(e)}")
            import traceback
            self._add_log(LogLevel.ERROR, f"📋 Traceback: {traceback.format_exc()}")
        finally:
            # Fechar browser
            if self.browser:
                await self.browser.close()
                self._add_log(LogLevel.INFO, "🔒 Browser fechado")
            if self.playwright:
                await self.playwright.stop()
            if self.session:
                await self.session.close()
            self.is_running = False
            self._add_log(LogLevel.INFO, "🛑 Robô parado")
            
    async def _executar_loop_principal(self):
        """Loop principal do robô"""
        ciclo = 0
        while self.is_running:
            ciclo += 1
            self._add_log(LogLevel.INFO, "🔄 ============================================")
            self._add_log(LogLevel.INFO, f"🚀 Iniciando ciclo #{ciclo}")
            self._add_log(LogLevel.INFO, "🔄 ============================================")
            
            # Screenshot do início do ciclo
            await self._take_screenshot(f"ciclo_{ciclo}_inicio", f"Início do ciclo #{ciclo}")
            
            try:
                # 1. Fazer login
                self._add_log(LogLevel.INFO, "📋 Etapa 1: Verificando autenticação...")
                login_success = await self._fazer_login()
                if not login_success:
                    self._add_log(LogLevel.WARNING, "⚠️ Falha no login, aguardando próximo ciclo")
                    await asyncio.sleep(self.config.intervalo_verificacao)
                    continue
                    
                # 2. Verificar estratégias
                self._add_log(LogLevel.INFO, "📋 Etapa 2: Verificando estratégias...")
                await self._verificar_estrategias()
                
                # 3. Verificar oportunidades
                self._add_log(LogLevel.INFO, "📋 Etapa 3: Verificando oportunidades...")
                await self._verificar_oportunidades()
                
                self._add_log(LogLevel.SUCCESS, f"✅ Ciclo #{ciclo} concluído com sucesso!")
                
            except Exception as e:
                self._add_log(LogLevel.ERROR, f"💥 Erro no ciclo #{ciclo}: {str(e)}")
                import traceback
                self._add_log(LogLevel.ERROR, f"📋 Traceback: {traceback.format_exc()}")
                await self._take_screenshot(f"ciclo_{ciclo}_erro", f"Erro no ciclo #{ciclo}: {str(e)}")
                
            # Screenshot do fim do ciclo
            await self._take_screenshot(f"ciclo_{ciclo}_fim", f"Fim do ciclo #{ciclo}")
            
            # Aguardar próximo ciclo
            self._add_log(LogLevel.INFO, f"⏳ Aguardando {self.config.intervalo_verificacao}s para próximo ciclo...")
            await asyncio.sleep(self.config.intervalo_verificacao)
            
    async def _fazer_login(self) -> bool:
        """Realiza login no BB Tips"""
        self._add_log(LogLevel.INFO, "🔐 Iniciando processo de login...")
        self._add_log(LogLevel.DEBUG, f"📧 Email: {self.config.email}")
        self._add_log(LogLevel.DEBUG, f"🌐 URL: {self.config.url_base}/api/login")
        
        # Screenshot antes do login
        await self._take_screenshot("login_inicio", "Página de login do BB Tips")
        
        try:
            self._add_log(LogLevel.INFO, "📡 Enviando requisição de login...")
            async with self.session.post(
                f"{self.config.url_base}/api/login",
                json={
                    "email": self.config.email,
                    "password": self.config.senha
                },
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                self._add_log(LogLevel.INFO, f"📥 Resposta recebida: HTTP {response.status}")
                
                if response.status == 200:
                    data = await response.json()
                    token = data.get('token', 'N/A')
                    self._add_log(LogLevel.SUCCESS, "✅ Login realizado com sucesso!")
                    self._add_log(LogLevel.INFO, f"🔑 Token: {token[:30]}..." if len(token) > 30 else f"🔑 Token: {token}")
                    # Screenshot após login bem-sucedido
                    await self._take_screenshot("login_sucesso", "Login realizado com sucesso")
                    return True
                else:
                    error_data = await response.json()
                    error_msg = error_data.get('message', 'Erro desconhecido')
                    self._add_log(LogLevel.ERROR, f"❌ Login falhou: {error_msg}")
                    self._add_log(LogLevel.ERROR, f"📊 Status HTTP: {response.status}")
                    # Screenshot após falha no login
                    await self._take_screenshot("login_falha", f"Falha no login: {error_msg}")
                    return False
                    
        except asyncio.TimeoutError:
            self._add_log(LogLevel.ERROR, "⏰ Timeout durante login (30s) - Servidor não respondeu")
            await self._take_screenshot("login_timeout", "Timeout no login")
            return False
        except Exception as e:
            self._add_log(LogLevel.ERROR, f"💥 Erro durante login: {str(e)}")
            import traceback
            self._add_log(LogLevel.ERROR, f"📋 Traceback: {traceback.format_exc()}")
            await self._take_screenshot("login_erro", f"Erro no login: {str(e)}")
            return False
            
    async def _verificar_estrategias(self):
        """Verifica estratégias ativas"""
        self._add_log(LogLevel.INFO, "📊 Verificando estratégias ativas...")
        
        # TODO: Implementar verificação de estratégias do banco
        estrategias = self.config.estrategias_ativas
        
        if not estrategias:
            self._add_log(LogLevel.WARNING, "⚠️ Nenhuma estratégia ativa configurada")
            self._add_log(LogLevel.INFO, "💡 Dica: Configure estratégias para ativar o monitoramento automático")
            return
            
        self._add_log(LogLevel.SUCCESS, f"✅ Encontradas {len(estrategias)} estratégias ativas!")
        for i, estrategia in enumerate(estrategias, 1):
            self._add_log(LogLevel.DEBUG, f"  {i}. {estrategia}")
        
    async def _verificar_oportunidades(self):
        """Verifica oportunidades de apostas"""
        self._add_log(LogLevel.INFO, "🔍 Verificando oportunidades de apostas...")
        
        # TODO: Implementar scraping de oportunidades
        oportunidades = []
        
        if not oportunidades:
            self._add_log(LogLevel.INFO, "📭 Nenhuma oportunidade encontrada neste ciclo")
        else:
            self._add_log(LogLevel.SUCCESS, f"🎯 Encontradas {len(oportunidades)} oportunidades!")
            for opp in oportunidades:
                self._add_log(LogLevel.DEBUG, f"  - Oportunidade: {opp}")
                
    async def parar(self):
        """Para o robô"""
        self._add_log(LogLevel.WARNING, "Solicitação de parada recebida")
        self.is_running = False
        
    def get_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Retorna os últimos logs"""
        return [
            {
                "timestamp": log.timestamp,
                "level": log.level,
                "message": log.message,
                "source": log.source,
                "details": log.details
            }
            for log in self.logs[-limit:]
        ]

# ============ WebSocket Manager ============

class WebSocketManager:
    """Gerenciador de WebSocket para logs em tempo real"""
    
    def __init__(self):
        self.websocket = None
        self.robo: Optional[BBTipsRobo] = None
        self.connections: set = set()
        
    async def broadcast_log(self, log_entry: LogEntry):
        """Envia log para todos os clientes conectados"""
        message = json.dumps({
            "type": "log",
            "data": {
                "timestamp": log_entry.timestamp,
                "level": log_entry.level,
                "message": log_entry.message,
                "source": log_entry.source,
                "details": log_entry.details
            }
        })
        
        # Envia para todas as conexões ativas
        disconnected = set()
        for ws in self.connections:
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.add(ws)
                
        # Remove conexões desconectadas
        self.connections -= disconnected
        
    def start_robo(self, config: RoboConfig):
        """Inicia o robô em background"""
        self.robo = BBTipsRobo(config)
        self.robo.set_log_callback(self.broadcast_log)
        
    def stop_robo(self):
        """Para o robô"""
        if self.robo:
            asyncio.create_task(self.robo.parar())
            self.robo = None
            
    def get_robo_status(self) -> Dict[str, Any]:
        """Retorna status do robô"""
        if self.robo is None:
            return {"status": "stopped", "logs": []}
            
        return {
            "status": "running" if self.robo.is_running else "stopping",
            "config": {
                "email": self.robo.config.email,
                "url_base": self.robo.config.url_base,
                "intervalo": self.robo.config.intervalo_verificacao,
                "debug": self.robo.config.modo_debug
            },
            "logs": self.robo.get_logs(100)
        }

# ============ Exemplo de uso ============

if __name__ == "__main__":
    # Exemplo de configuração
    config = RoboConfig(
        credencial_id="123",
        email="teste@bbtips.com",
        senha="senha123",
        url_base="https://app.bbtips.com.br",
        intervalo_verificacao=30,
        estrategias_ativas=[" Estrategia 1", "Estrategia 2"],
        modo_debug=True
    )
    
    robo = BBTipsRobo(config)
    
    # Iniciar robô
    asyncio.run(robo.iniciar())
