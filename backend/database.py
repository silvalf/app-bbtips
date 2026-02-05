"""
Módulo de conexão com SQL Server para o BBTips
"""
import os
import pyodbc
from dotenv import load_dotenv
from pathlib import Path
from typing import List, Optional, Dict, Any
from contextlib import contextmanager
import logging

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

class SQLServerConnection:
    """Classe para gerenciar conexão com SQL Server"""
    
    def __init__(self):
        self.server = os.environ.get('SQL_SERVER', 'LUIZSILVA\\SQLEXPRESS')
        self.database = os.environ.get('SQL_DATABASE', 'BBTipsDB')
        self.user = os.environ.get('SQL_USER', 'sa')
        self.password = os.environ.get('SQL_PASSWORD', '')
        
    def get_connection_string(self) -> str:
        """Retorna a string de conexão"""
        if self.password:
            return (
                f"DRIVER={{ODBC Driver 17 for SQL Server}};"
                f"SERVER={self.server};"
                f"DATABASE={self.database};"
                f"UID={self.user};"
                f"PWD={self.password};"
                f"TrustServerCertificate=yes;"
            )
        else:
            return (
                f"DRIVER={{ODBC Driver 17 for SQL Server}};"
                f"SERVER={self.server};"
                f"DATABASE={self.database};"
                f"Trusted_Connection=yes;"
                f"TrustServerCertificate=yes;"
            )
    
    @contextmanager
    def get_connection(self):
        """Context manager para conexão com o banco"""
        conn = None
        try:
            conn = pyodbc.connect(self.get_connection_string())
            yield conn
        except pyodbc.Error as e:
            logger.error(f"Erro de conexão com SQL Server: {e}")
            raise
        finally:
            if conn:
                conn.close()
    
    def test_connection(self) -> bool:
        """Testa a conexão com o banco de dados"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                cursor.fetchone()
                return True
        except Exception as e:
            logger.error(f"Teste de conexão falhou: {e}")
            return False


class BancaRepository:
    """Repositório para operações com Bancas"""
    
    def __init__(self, connection: SQLServerConnection):
        self.conn = connection
    
    def get_all(self) -> List[Dict[str, Any]]:
        """Retorna todas as bancas"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT Id, Nome, SaldoInicial, SaldoAtual, StopLoss, StopGain,
                       StakeBase, Estrategia, Status, Mercado, DataCriacao,
                       DataUltimaOperacao, Multiplicador, MaxGales
                FROM Banca
                ORDER BY DataCriacao DESC
            """)
            rows = cursor.fetchall()
            
            bancas = []
            for row in rows:
                bancas.append({
                    'Id': str(row.Id),
                    'Nome': row.Nome,
                    'SaldoInicial': float(row.SaldoInicial),
                    'SaldoAtual': float(row.SaldoAtual),
                    'StopLoss': float(row.StopLoss),
                    'StopGain': float(row.StopGain),
                    'StakeBase': float(row.StakeBase),
                    'Estrategia': row.Estrategia,
                    'Status': row.Status,
                    'Mercado': row.Mercado,
                    'DataCriacao': row.DataCriacao.isoformat() if row.DataCriacao else None,
                    'DataUltimaOperacao': row.DataUltimaOperacao.isoformat() if row.DataUltimaOperacao else None,
                    'Multiplicador': float(row.Multiplicador),
                    'MaxGales': row.MaxGales
                })
            return bancas
    
    def get_by_id(self, banca_id: str) -> Optional[Dict[str, Any]]:
        """Retorna uma banca pelo ID"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT Id, Nome, SaldoInicial, SaldoAtual, StopLoss, StopGain,
                       StakeBase, Estrategia, Status, Mercado, DataCriacao,
                       DataUltimaOperacao, Multiplicador, MaxGales
                FROM Banca
                WHERE Id = ?
            """, (banca_id,))
            row = cursor.fetchone()
            
            if row:
                return {
                    'Id': str(row.Id),
                    'Nome': row.Nome,
                    'SaldoInicial': float(row.SaldoInicial),
                    'SaldoAtual': float(row.SaldoAtual),
                    'StopLoss': float(row.StopLoss),
                    'StopGain': float(row.StopGain),
                    'StakeBase': float(row.StakeBase),
                    'Estrategia': row.Estrategia,
                    'Status': row.Status,
                    'Mercado': row.Mercado,
                    'DataCriacao': row.DataCriacao.isoformat() if row.DataCriacao else None,
                    'DataUltimaOperacao': row.DataUltimaOperacao.isoformat() if row.DataUltimaOperacao else None,
                    'Multiplicador': float(row.Multiplicador),
                    'MaxGales': row.MaxGales
                }
            return None
    
    def create(self, banca: Dict[str, Any]) -> str:
        """Cria uma nova banca e retorna o ID"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO Banca (Nome, SaldoInicial, SaldoAtual, StopLoss, StopGain,
                                  StakeBase, Estrategia, Status, Mercado, Multiplicador, MaxGales)
                OUTPUT INSERTED.Id
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                banca['Nome'],
                banca['SaldoInicial'],
                banca['SaldoInicial'],  # SaldoAtual começa igual ao SaldoInicial
                banca['StopLoss'],
                banca['StopGain'],
                banca['StakeBase'],
                banca['Estrategia'],
                banca.get('Status', 1),
                banca['Mercado'],
                banca.get('Multiplicador', 2.0),
                banca.get('MaxGales', 3)
            ))
            banca_id = cursor.fetchone()[0]
            conn.commit()
            return str(banca_id)
    
    def update(self, banca_id: str, banca: Dict[str, Any]) -> bool:
        """Atualiza uma banca"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE Banca
                SET Nome = ?, SaldoInicial = ?, SaldoAtual = ?, StopLoss = ?,
                    StopGain = ?, StakeBase = ?, Estrategia = ?, Status = ?,
                    Mercado = ?, Multiplicador = ?, MaxGales = ?
                WHERE Id = ?
            """, (
                banca['Nome'],
                banca['SaldoInicial'],
                banca['SaldoAtual'],
                banca['StopLoss'],
                banca['StopGain'],
                banca['StakeBase'],
                banca['Estrategia'],
                banca['Status'],
                banca['Mercado'],
                banca['Multiplicador'],
                banca['MaxGales'],
                banca_id
            ))
            conn.commit()
            return cursor.rowcount > 0
    
    def delete(self, banca_id: str) -> bool:
        """Exclui uma banca"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM Banca WHERE Id = ?", (banca_id,))
            conn.commit()
            return cursor.rowcount > 0


class OperacaoRepository:
    """Repositório para operações com Operações"""
    
    def __init__(self, connection: SQLServerConnection):
        self.conn = connection
    
    def get_by_banca_id(self, banca_id: str) -> List[Dict[str, Any]]:
        """Retorna todas as operações de uma banca"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT Id, BancaId, PadraoId, Stake, Odd, RetornoReal, Status, Mercado,
                       Evento, Liga, Placar, PlacarFinal, NumeroGale, OperacaoAnteriorId,
                       DataHora, Observacao
                FROM Operacao
                WHERE BancaId = ?
                ORDER BY DataHora DESC
            """, (banca_id,))
            rows = cursor.fetchall()
            
            operacoes = []
            for row in rows:
                operacoes.append({
                    'Id': str(row.Id),
                    'BancaId': str(row.BancaId),
                    'PadraoId': str(row.PadraoId) if row.PadraoId else None,
                    'Stake': float(row.Stake),
                    'Odd': float(row.Odd),
                    'RetornoReal': float(row.RetornoReal) if row.RetornoReal else None,
                    'Status': row.Status,
                    'Mercado': row.Mercado,
                    'Evento': row.Evento,
                    'Liga': row.Liga,
                    'Placar': row.Placar,
                    'PlacarFinal': row.PlacarFinal,
                    'NumeroGale': row.NumeroGale,
                    'OperacaoAnteriorId': str(row.OperacaoAnteriorId) if row.OperacaoAnteriorId else None,
                    'DataHora': row.DataHora.isoformat() if row.DataHora else None,
                    'Observacao': row.Observacao
                })
            return operacoes
    
    def create(self, operacao: Dict[str, Any]) -> str:
        """Cria uma nova operação"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO Operacao (BancaId, PadraoId, Stake, Odd, Status, Mercado,
                                     Evento, Liga, Placar, NumeroGale, OperacaoAnteriorId, Observacao)
                OUTPUT INSERTED.Id
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                operacao['BancaId'],
                operacao.get('PadraoId'),
                operacao['Stake'],
                operacao['Odd'],
                operacao.get('Status', 1),
                operacao['Mercado'],
                operacao.get('Evento'),
                operacao.get('Liga'),
                operacao.get('Placar'),
                operacao.get('NumeroGale', 0),
                operacao.get('OperacaoAnteriorId'),
                operacao.get('Observacao')
            ))
            operacao_id = cursor.fetchone()[0]
            conn.commit()
            return str(operacao_id)
    
    def update_status(self, operacao_id: str, status: int, retorno_real: float = None) -> bool:
        """Atualiza o status de uma operação"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            if retorno_real is not None:
                cursor.execute("""
                    UPDATE Operacao
                    SET Status = ?, RetornoReal = ?
                    WHERE Id = ?
                """, (status, retorno_real, operacao_id))
            else:
                cursor.execute("""
                    UPDATE Operacao
                    SET Status = ?
                    WHERE Id = ?
                """, (status, operacao_id))
            conn.commit()
            return cursor.rowcount > 0


class ConfiguracaoRepository:
    """Repositório para operações com Configurações"""
    
    def __init__(self, connection: SQLServerConnection):
        self.conn = connection
    
    def get_bbtips_config(self) -> Optional[Dict[str, Any]]:
        """Retorna as configurações do BB Tips"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT TOP 1 Id, Email, Senha, UrlBase, LembrarCredenciais, 
                       AutoLogin, TimeoutSegundos, ModoDebug, DataCriacao, DataAtualizacao
                FROM ConfiguracaoBBTips
                ORDER BY Id DESC
            """)
            row = cursor.fetchone()
            
            if row:
                return {
                    'Id': row.Id,
                    'Email': row.Email,
                    'Senha': row.Senha,
                    'UrlBase': row.UrlBase,
                    'LembrarCredenciais': bool(row.LembrarCredenciais),
                    'AutoLogin': bool(row.AutoLogin),
                    'TimeoutSegundos': row.TimeoutSegundos,
                    'ModoDebug': bool(row.ModoDebug),
                    'DataCriacao': row.DataCriacao.isoformat() if row.DataCriacao else None,
                    'DataAtualizacao': row.DataAtualizacao.isoformat() if row.DataAtualizacao else None
                }
            return None
    
    def update_bbtips_config(self, config: Dict[str, Any]) -> bool:
        """Atualiza as configurações do BB Tips"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE ConfiguracaoBBTips
                SET Email = ?, Senha = ?, UrlBase = ?, LembrarCredenciais = ?,
                    AutoLogin = ?, TimeoutSegundos = ?, ModoDebug = ?, DataAtualizacao = GETDATE()
                WHERE Id = (SELECT TOP 1 Id FROM ConfiguracaoBBTips ORDER BY Id DESC)
            """, (
                config.get('Email'),
                config.get('Senha'),
                config.get('UrlBase', 'https://app.bbtips.com.br'),
                config.get('LembrarCredenciais', False),
                config.get('AutoLogin', False),
                config.get('TimeoutSegundos', 30),
                config.get('ModoDebug', False)
            ))
            conn.commit()
            return cursor.rowcount > 0
    
    def get_geral_config(self) -> Optional[Dict[str, Any]]:
        """Retorna as configurações gerais"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT TOP 1 Id, NotificacoesAtivas, SomAlerta, IntervaloAtualizacao,
                       TemaAplicacao, IniciarComWindows, CaminhoBancoDados, DataCriacao, DataAtualizacao
                FROM ConfiguracaoGeral
                ORDER BY Id DESC
            """)
            row = cursor.fetchone()
            
            if row:
                return {
                    'Id': row.Id,
                    'NotificacoesAtivas': bool(row.NotificacoesAtivas),
                    'SomAlerta': bool(row.SomAlerta),
                    'IntervaloAtualizacao': row.IntervaloAtualizacao,
                    'TemaAplicacao': row.TemaAplicacao,
                    'IniciarComWindows': bool(row.IniciarComWindows),
                    'CaminhoBancoDados': row.CaminhoBancoDados,
                    'DataCriacao': row.DataCriacao.isoformat() if row.DataCriacao else None,
                    'DataAtualizacao': row.DataAtualizacao.isoformat() if row.DataAtualizacao else None
                }
            return None
    
    def update_geral_config(self, config: Dict[str, Any]) -> bool:
        """Atualiza as configurações gerais"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE ConfiguracaoGeral
                SET NotificacoesAtivas = ?, SomAlerta = ?, IntervaloAtualizacao = ?,
                    TemaAplicacao = ?, IniciarComWindows = ?, CaminhoBancoDados = ?, 
                    DataAtualizacao = GETDATE()
                WHERE Id = (SELECT TOP 1 Id FROM ConfiguracaoGeral ORDER BY Id DESC)
            """, (
                config.get('NotificacoesAtivas', True),
                config.get('SomAlerta', True),
                config.get('IntervaloAtualizacao', 5),
                config.get('TemaAplicacao', 'Dark'),
                config.get('IniciarComWindows', False),
                config.get('CaminhoBancoDados')
            ))
            conn.commit()
            return cursor.rowcount > 0


class PadraoRepository:
    """Repositório para operações com Padrões"""
    
    def __init__(self, connection: SQLServerConnection):
        self.conn = connection
    
    def get_all(self, ativo: bool = True) -> List[Dict[str, Any]]:
        """Retorna todos os padrões"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT Id, Nome, Descricao, OddMinima, OddMaxima, OddMedia, Placar,
                       Assertividade, TotalJogos, TotalAcertos, Liga, Time, MinutoInicio,
                       MinutoFim, Mercado, DataCriacao, Ativo, VezesUsado, LucroGerado
                FROM Padrao
                WHERE Ativo = ? OR ? = 0
                ORDER BY DataCriacao DESC
            """, (ativo, ativo))
            rows = cursor.fetchall()
            
            padroes = []
            for row in rows:
                padroes.append({
                    'Id': str(row.Id),
                    'Nome': row.Nome,
                    'Descricao': row.Descricao,
                    'OddMinima': float(row.OddMinima),
                    'OddMaxima': float(row.OddMaxima),
                    'OddMedia': float(row.OddMedia),
                    'Placar': row.Placar,
                    'Assertividade': float(row.Assertividade),
                    'TotalJogos': row.TotalJogos,
                    'TotalAcertos': row.TotalAcertos,
                    'Liga': row.Liga,
                    'Time': row.Time,
                    'MinutoInicio': row.MinutoInicio,
                    'MinutoFim': row.MinutoFim,
                    'Mercado': row.Mercado,
                    'DataCriacao': row.DataCriacao.isoformat() if row.DataCriacao else None,
                    'Ativo': bool(row.Ativo),
                    'VezesUsado': row.VezesUsado,
                    'LucroGerado': float(row.LucroGerado)
                })
            return padroes
    
    def create(self, padrao: Dict[str, Any]) -> str:
        """Cria um novo padrão"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO Padrao (Nome, Descricao, OddMinima, OddMaxima, OddMedia, Placar,
                                   Assertividade, TotalJogos, TotalAcertos, Liga, Time, MinutoInicio,
                                   MinutoFim, Mercado, Ativo, VezesUsado, LucroGerado)
                OUTPUT INSERTED.Id
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                padrao['Nome'],
                padrao.get('Descricao'),
                padrao['OddMinima'],
                padrao['OddMaxima'],
                padrao['OddMedia'],
                padrao.get('Placar'),
                padrao.get('Assertividade', 0),
                padrao.get('TotalJogos', 0),
                padrao.get('TotalAcertos', 0),
                padrao.get('Liga'),
                padrao.get('Time'),
                padrao.get('MinutoInicio', 0),
                padrao.get('MinutoFim', 0),
                padrao['Mercado'],
                padrao.get('Ativo', True),
                padrao.get('VezesUsado', 0),
                padrao.get('LucroGerado', 0)
            ))
            padrao_id = cursor.fetchone()[0]
            conn.commit()
            return str(padrao_id)