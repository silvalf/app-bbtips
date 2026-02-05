# Configuração do Banco de Dados SQL Server

Este documento descreve como configurar o banco de dados SQL Server para o aplicativo BBTips.

## Pré-requisitos

1. SQL Server Express (ou versão superior) instalado
2. SQL Server Management Studio (SSMS) ou Azure Data Studio
3. Python 3.8 ou superior
4. ODBC Driver 17 for SQL Server

## Passo 1: Instalar o ODBC Driver

### Windows
Baixe e instale o ODBC Driver 17 for SQL Server:
https://docs.microsoft.com/pt-br/sql/connect/odbc/download-odbc-driver-for-sql-server

### Linux/macOS
```bash
# Ubuntu/Debian
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
curl https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/prod.list | sudo tee /etc/apt/sources.list.d/mssql-release.list
sudo apt-get update
sudo ACCEPT_EULA=Y apt-get install -y msodbcsql17
```

## Passo 2: Criar o Banco de Dados

1. Abra o SQL Server Management Studio (SSMS)
2. Conecte-se ao servidor: `LUIZSILVA\SQLEXPRESS`
3. Abra o arquivo `backend/database_schema.sql`
4. Execute o script para criar o banco de dados e tabelas

Ou execute via linha de comando:
```bash
sqlcmd -S LUIZSILVA\SQLEXPRESS -i backend/database_schema.sql
```

## Passo 3: Configurar Variáveis de Ambiente

Edite o arquivo `backend/.env`:

```env
# SQL Server Configuration
SQL_SERVER=LUIZSILVA\SQLEXPRESS
SQL_DATABASE=BBTipsDB
# Windows Authentication (sem senha - usuário do Windows)
SQL_USER=
SQL_PASSWORD=

CORS_ORIGINS="*"
```

**Nota:** O projeto está configurado para usar **Autenticação do Windows** (Trusted Connection), então não é necessário informar usuário e senha.

## Passo 4: Instalar Dependências Python

```bash
cd backend
pip install -r requirements.txt
```

## Passo 5: Executar o Servidor

```bash
cd backend
python server.py
```

O servidor estará disponível em: `http://localhost:8000`

## Estrutura das Tabelas

### Banca
Armazena informações sobre as bancas de gerenciamento de bankroll.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Id | UNIQUEIDENTIFIER | Identificador único |
| Nome | NVARCHAR(255) | Nome da banca |
| SaldoInicial | DECIMAL | Saldo inicial |
| SaldoAtual | DECIMAL | Saldo atual |
| StopLoss | DECIMAL | Porcentagem de stop loss |
| StopGain | DECIMAL | Porcentagem de meta |
| StakeBase | DECIMAL | Valor base da entrada |
| Estrategia | INT | Tipo de estratégia |
| Status | INT | Status da banca |
| Mercado | INT | Tipo de mercado |
| Multiplicador | DECIMAL | Multiplicador de gale |
| MaxGales | INT | Máximo de gales |

### Operacao
Armazena as operações realizadas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Id | UNIQUEIDENTIFIER | Identificador único |
| BancaId | UNIQUEIDENTIFIER | FK para Banca |
| Stake | DECIMAL | Valor da entrada |
| Odd | DECIMAL | Odd da operação |
| Status | INT | Status da operação |
| Evento | NVARCHAR(500) | Jogo/evento |
| Liga | NVARCHAR(255) | Liga do jogo |

### ConfiguracaoBBTips
Armazena credenciais e configurações do BB Tips.

### ConfiguracaoGeral
Armazena configurações gerais do aplicativo.

### Padrao
Armazena padrões de entrada identificados.

## Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/health | Verifica saúde do banco |
| GET | /api/bancas | Lista todas as bancas |
| POST | /api/bancas | Cria nova banca |
| GET | /api/bancas/{id} | Busca banca por ID |
| PUT | /api/bancas/{id} | Atualiza banca |
| DELETE | /api/bancas/{id} | Exclui banca |
| GET | /api/bancas/{id}/operacoes | Lista operações de uma banca |
| POST | /api/operacoes | Cria nova operação |
| PUT | /api/operacoes/{id}/status | Atualiza status da operação |
| GET | /api/config/bbtips | Configurações do BB Tips |
| PUT | /api/config/bbtips | Atualiza configurações do BB Tips |
| GET | /api/config/geral | Configurações gerais |
| PUT | /api/config/geral | Atualiza configurações gerais |

## Conexão do App Mobile

O app MAUI está configurado para usar o backend SQL Server por padrão. Para alterar entre SQL Server e JSON local, edite `MauiProgram.cs`:

```csharp
// Para usar SQL Server:
private const string STORAGE_TYPE = "sqlserver";

// Para usar JSON local:
private const string STORAGE_TYPE = "local";
```

## Testando a Conexão

1. Execute o servidor: `python server.py`
2. Acesse: `http://localhost:8000/api/health`
3. Você deve ver uma resposta similar a:
```json
{
    "status": "healthy",
    "database": "SQL Server",
    "connected": true
}
```

## Solução de Problemas

### Erro de conexão
- Verifique se o SQL Server está rodando
- Verifique se o servidor `LUIZSILVA\SQLEXPRESS` está acessível
- Verifique se o ODBC Driver está instalado

**Nota:** O projeto usa Autenticação do Windows, então não há senha para configurar.

### Porta já em uso
- Pare outros processos usando a porta 8000
- Altere a porta no arquivo `server.py` se necessário
