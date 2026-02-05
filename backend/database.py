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
import uuid

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


class CredencialBBTipsRepository:
    """Repositório para operações com Credenciais BB Tips"""
    
    def __init__(self, connection: SQLServerConnection):
        self.conn = connection
    
    def get_all(self) -> List[Dict[str, Any]]:
        """Retorna todas as credenciais"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT Id, Nome, Email, Senha, UrlBase, TimeoutSegundos, ModoDebug,
                       EhPrincipal, Ativa, DataCriacao, DataAtualizacao
                FROM CredencialBBTips
                ORDER BY EhPrincipal DESC, DataCriacao DESC
            """)
            rows = cursor.fetchall()
            
            credenciais = []
            for row in rows:
                credenciais.append({
                    'Id': str(row.Id),
                    'Nome': row.Nome,
                    'Email': row.Email,
                    'Senha': row.Senha,
                    'UrlBase': row.UrlBase,
                    'TimeoutSegundos': row.TimeoutSegundos,
                    'ModoDebug': bool(row.ModoDebug),
                    'EhPrincipal': bool(row.EhPrincipal),
                    'Ativa': bool(row.Ativa),
                    'DataCriacao': row.DataCriacao.isoformat() if row.DataCriacao else None,
                    'DataAtualizacao': row.DataAtualizacao.isoformat() if row.DataAtualizacao else None
                })
            return credenciais
    
    def get_by_id(self, credencial_id: str) -> Optional[Dict[str, Any]]:
        """Retorna uma credencial pelo ID"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT Id, Nome, Email, Senha, UrlBase, TimeoutSegundos, ModoDebug,
                       EhPrincipal, Ativa, DataCriacao, DataAtualizacao
                FROM CredencialBBTips
                WHERE Id = ?
            """, (credencial_id,))
            row = cursor.fetchone()
            
            if row:
                return {
                    'Id': str(row.Id),
                    'Nome': row.Nome,
                    'Email': row.Email,
                    'Senha': row.Senha,
                    'UrlBase': row.UrlBase,
                    'TimeoutSegundos': row.TimeoutSegundos,
                    'ModoDebug': bool(row.ModoDebug),
                    'EhPrincipal': bool(row.EhPrincipal),
                    'Ativa': bool(row.Ativa),
                    'DataCriacao': row.DataCriacao.isoformat() if row.DataCriacao else None,
                    'DataAtualizacao': row.DataAtualizacao.isoformat() if row.DataAtualizacao else None
                }
            return None
    
    def get_principal(self) -> Optional[Dict[str, Any]]:
        """Retorna a credencial principal"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT TOP 1 Id, Nome, Email, Senha, UrlBase, TimeoutSegundos, ModoDebug,
                       EhPrincipal, Ativa, DataCriacao, DataAtualizacao
                FROM CredencialBBTips
                WHERE EhPrincipal = 1 AND Ativa = 1
                ORDER BY DataAtualizacao DESC
            """)
            row = cursor.fetchone()
            
            if row:
                return {
                    'Id': str(row.Id),
                    'Nome': row.Nome,
                    'Email': row.Email,
                    'Senha': row.Senha,
                    'UrlBase': row.UrlBase,
                    'TimeoutSegundos': row.TimeoutSegundos,
                    'ModoDebug': bool(row.ModoDebug),
                    'EhPrincipal': bool(row.EhPrincipal),
                    'Ativa': bool(row.Ativa),
                    'DataCriacao': row.DataCriacao.isoformat() if row.DataCriacao else None,
                    'DataAtualizacao': row.DataAtualizacao.isoformat() if row.DataAtualizacao else None
                }
            return None
    
    def create(self, credencial: Dict[str, Any]) -> str:
        """Cria uma nova credencial"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            
            # Se for definida como principal, remove flag das outras
            if credencial.get('EhPrincipal', False):
                cursor.execute("UPDATE CredencialBBTips SET EhPrincipal = 0 WHERE EhPrincipal = 1")
            
            cursor.execute("""
                INSERT INTO CredencialBBTips (Nome, Email, Senha, UrlBase, TimeoutSegundos, ModoDebug, EhPrincipal, Ativa)
                OUTPUT INSERTED.Id
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                credencial['Nome'],
                credencial['Email'],
                credencial.get('Senha'),
                credencial.get('UrlBase', 'https://app.bbtips.com.br'),
                credencial.get('TimeoutSegundos', 30),
                credencial.get('ModoDebug', False),
                credencial.get('EhPrincipal', False),
                credencial.get('Ativa', True)
            ))
            credencial_id = cursor.fetchone()[0]
            conn.commit()
            return str(credencial_id)
    
    def update(self, credencial_id: str, credencial: Dict[str, Any]) -> bool:
        """Atualiza uma credencial"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            
            # Se for definida como principal, remove flag das outras
            if credencial.get('EhPrincipal', False):
                cursor.execute("UPDATE CredencialBBTips SET EhPrincipal = 0 WHERE EhPrincipal = 1")
            
            cursor.execute("""
                UPDATE CredencialBBTips
                SET Nome = ?, Email = ?, Senha = ?, UrlBase = ?, TimeoutSegundos = ?,
                    ModoDebug = ?, EhPrincipal = ?, Ativa = ?, DataAtualizacao = GETDATE()
                WHERE Id = ?
            """, (
                credencial['Nome'],
                credencial['Email'],
                credencial.get('Senha'),
                credencial.get('UrlBase', 'https://app.bbtips.com.br'),
                credencial.get('TimeoutSegundos', 30),
                credencial.get('ModoDebug', False),
                credencial.get('EhPrincipal', False),
                credencial.get('Ativa', True),
                credencial_id
            ))
            conn.commit()
            return cursor.rowcount > 0
    
    def delete(self, credencial_id: str) -> bool:
        """Exclui uma credencial"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            
            # Verifica se é a única credencial
            cursor.execute("SELECT COUNT(*) FROM CredencialBBTips")
            if cursor.fetchone()[0] <= 1:
                return False
            
            # Se for principal, define outra como principal
            cursor.execute("SELECT EhPrincipal FROM CredencialBBTips WHERE Id = ?", (credencial_id,))
            row = cursor.fetchone()
            if row and row[0]:
                cursor.execute("UPDATE CredencialBBTips SET EhPrincipal = 1 WHERE Id != ? AND Ativa = 1", (credencial_id,))
            
            cursor.execute("DELETE FROM CredencialBBTips WHERE Id = ?", (credencial_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    def set_principal(self, credencial_id: str) -> bool:
        """Define uma credencial como principal"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("UPDATE CredencialBBTips SET EhPrincipal = 0 WHERE EhPrincipal = 1")
            cursor.execute("UPDATE CredencialBBTips SET EhPrincipal = 1 WHERE Id = ?", (credencial_id,))
            cursor.execute("UPDATE ConfiguracaoGeral SET CredencialBBTipsId = ?, DataAtualizacao = GETDATE()", (credencial_id,))
            
            conn.commit()
            return cursor.rowcount > 0


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
                       StakeBase, StakePercent, Estrategia, Status, Mercado, DataCriacao,
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
                    'StakePercent': float(row.StakePercent) if row.StakePercent else None,
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
                       StakeBase, StakePercent, Estrategia, Status, Mercado, DataCriacao,
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
                    'StakePercent': float(row.StakePercent) if row.StakePercent else None,
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
                                  StakeBase, StakePercent, Estrategia, Status, Mercado, Multiplicador, MaxGales)
                OUTPUT INSERTED.Id
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                banca['Nome'],
                banca['SaldoInicial'],
                banca['SaldoInicial'],  # SaldoAtual começa igual ao SaldoInicial
                banca['StopLoss'],
                banca['StopGain'],
                banca['StakeBase'],
                banca.get('StakePercent', 2.0),
                banca.get('Estrategia', 2),
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
                    StopGain = ?, StakeBase = ?, StakePercent = ?, Estrategia = ?, Status = ?,
                    Mercado = ?, Multiplicador = ?, MaxGales = ?
                WHERE Id = ?
            """, (
                banca['Nome'],
                banca['SaldoInicial'],
                banca['SaldoAtual'],
                banca['StopLoss'],
                banca['StopGain'],
                banca['StakeBase'],
                banca.get('StakePercent', 2.0),
                banca.get('Estrategia', 2),
                banca.get('Status', 1),
                banca['Mercado'],
                banca.get('Multiplicador', 2.0),
                banca.get('MaxGales', 3),
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
    
    def get_geral_config(self) -> Optional[Dict[str, Any]]:
        """Retorna as configurações gerais"""
        with self.conn.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT TOP 1 Id, NotificacoesAtivas, SomAlerta, IntervaloAtualizacao,
                       TemaAplicacao, IniciarComWindows, CaminhoBancoDados, CredencialBBTipsId,
                       DataCriacao, DataAtualizacao
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
                    'CredencialBBTipsId': str(row.CredencialBBTipsId) if row.CredencialBBTipsId else None,
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
                    CredencialBBTipsId = ?, DataAtualizacao = GETDATE()
                WHERE Id = (SELECT TOP 1 Id FROM ConfiguracaoGeral ORDER BY Id DESC)
            """, (
                config.get('NotificacoesAtivas', True),
                config.get('SomAlerta', True),
                config.get('IntervaloAtualizacao', 5),
                config.get('TemaAplicacao', 'Dark'),
                config.get('IniciarComWindows', False),
                config.get('CaminhoBancoDados'),
                config.get('CredencialBBTipsId')
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
