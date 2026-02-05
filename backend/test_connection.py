"""
Script para testar conexao com SQL Server
"""
import os
import sys
from pathlib import Path

# Adicionar diretorio atual ao path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
from database import SQLServerConnection

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

print("=== Teste de Conexao SQL Server ===")
print()

# Configuracoes
sql_conn = SQLServerConnection()
print("Servidor: " + sql_conn.server)
print("Banco de Dados: " + sql_conn.database)
print()

# Testar conexao
print("Testando conexao...")
if sql_conn.test_connection():
    print("[OK] Conexao bem-sucedida!")
else:
    print("[ERRO] Falha na conexao")
    print()
    print("Verifique:")
    print("1. SQL Server esta rodando (servico MSSQLSERVER)")
    print("2. Servidor correto: LUIZSILVA\\SQLEXPRESS")
    print("3. Banco de dados BBTipsDB foi criado")
