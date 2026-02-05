-- Script de criação do banco de dados BBTips
-- Servidor: LUIZSILVA\SQLEXPRESS

-- Criar banco de dados
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'BBTipsDB')
BEGIN
    CREATE DATABASE BBTipsDB;
END
GO

USE BBTipsDB;
GO

-- Tabela de Configurações BB Tips
CREATE TABLE [dbo].[ConfiguracaoBBTips] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Email] NVARCHAR(255) NOT NULL,
    [Senha] NVARCHAR(500) NULL,
    [UrlBase] NVARCHAR(500) NOT NULL DEFAULT 'https://app.bbtips.com.br',
    [LembrarCredenciais] BIT NOT NULL DEFAULT 0,
    [AutoLogin] BIT NOT NULL DEFAULT 0,
    [TimeoutSegundos] INT NOT NULL DEFAULT 30,
    [ModoDebug] BIT NOT NULL DEFAULT 0,
    [DataCriacao] DATETIME NOT NULL DEFAULT GETDATE(),
    [DataAtualizacao] DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- Tabela de Configurações Gerais
CREATE TABLE [dbo].[ConfiguracaoGeral] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [NotificacoesAtivas] BIT NOT NULL DEFAULT 1,
    [SomAlerta] BIT NOT NULL DEFAULT 1,
    [IntervaloAtualizacao] INT NOT NULL DEFAULT 5,
    [TemaAplicacao] NVARCHAR(50) NOT NULL DEFAULT 'Dark',
    [IniciarComWindows] BIT NOT NULL DEFAULT 0,
    [CaminhoBancoDados] NVARCHAR(500) NULL,
    [DataCriacao] DATETIME NOT NULL DEFAULT GETDATE(),
    [DataAtualizacao] DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- Tabela de Bancas
CREATE TABLE [dbo].[Banca] (
    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [Nome] NVARCHAR(255) NOT NULL,
    [SaldoInicial] DECIMAL(18,2) NOT NULL,
    [SaldoAtual] DECIMAL(18,2) NOT NULL,
    [StopLoss] DECIMAL(5,2) NOT NULL,
    [StopGain] DECIMAL(5,2) NOT NULL,
    [StakeBase] DECIMAL(18,2) NOT NULL,
    [Estrategia] INT NOT NULL,
    [Status] INT NOT NULL DEFAULT 1,
    [Mercado] INT NOT NULL,
    [DataCriacao] DATETIME NOT NULL DEFAULT GETDATE(),
    [DataUltimaOperacao] DATETIME NULL,
    [Multiplicador] DECIMAL(5,2) NOT NULL DEFAULT 2.0,
    [MaxGales] INT NOT NULL DEFAULT 3
);
GO

-- Tabela de Padrões (criar antes de Operacao pois Operacao referencia Padrao)
CREATE TABLE [dbo].[Padrao] (
    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [Nome] NVARCHAR(255) NOT NULL,
    [Descricao] NVARCHAR(1000) NULL,
    [OddMinima] DECIMAL(5,2) NOT NULL,
    [OddMaxima] DECIMAL(5,2) NOT NULL,
    [OddMedia] DECIMAL(5,2) NOT NULL,
    [Placar] NVARCHAR(50) NULL,
    [Assertividade] DECIMAL(5,2) NOT NULL,
    [TotalJogos] INT NOT NULL DEFAULT 0,
    [TotalAcertos] INT NOT NULL DEFAULT 0,
    [Liga] NVARCHAR(255) NULL,
    [Time] NVARCHAR(255) NULL,
    [MinutoInicio] INT NOT NULL DEFAULT 0,
    [MinutoFim] INT NOT NULL DEFAULT 0,
    [Mercado] INT NOT NULL,
    [DataCriacao] DATETIME NOT NULL DEFAULT GETDATE(),
    [Ativo] BIT NOT NULL DEFAULT 1,
    [VezesUsado] INT NOT NULL DEFAULT 0,
    [LucroGerado] DECIMAL(18,2) NOT NULL DEFAULT 0
);
GO

-- Tabela de Operações
CREATE TABLE [dbo].[Operacao] (
    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [BancaId] UNIQUEIDENTIFIER NOT NULL,
    [PadraoId] UNIQUEIDENTIFIER NULL,
    [Stake] DECIMAL(18,2) NOT NULL,
    [Odd] DECIMAL(5,2) NOT NULL,
    [RetornoReal] DECIMAL(18,2) NULL,
    [Status] INT NOT NULL DEFAULT 1,
    [Mercado] INT NOT NULL,
    [Evento] NVARCHAR(500) NULL,
    [Liga] NVARCHAR(255) NULL,
    [Placar] NVARCHAR(50) NULL,
    [PlacarFinal] NVARCHAR(50) NULL,
    [NumeroGale] INT NOT NULL DEFAULT 0,
    [OperacaoAnteriorId] UNIQUEIDENTIFIER NULL,
    [DataHora] DATETIME NOT NULL DEFAULT GETDATE(),
    [Observacao] NVARCHAR(1000) NULL,
    CONSTRAINT FK_Operacao_Banca FOREIGN KEY ([BancaId]) REFERENCES [Banca]([Id]) ON DELETE CASCADE,
    CONSTRAINT FK_Operacao_Padrao FOREIGN KEY ([PadraoId]) REFERENCES [Padrao]([Id]) ON DELETE SET NULL
);
GO

-- Tabela de Logs/Auditoria
CREATE TABLE [dbo].[LogOperacao] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Tipo] NVARCHAR(50) NOT NULL,
    [Mensagem] NVARCHAR(MAX) NULL,
    [Detalhe] NVARCHAR(MAX) NULL,
    [DataHora] DATETIME NOT NULL DEFAULT GETDATE(),
    [Nivel] NVARCHAR(20) NOT NULL DEFAULT 'INFO'
);
GO

-- Criar índices para melhorar performance
CREATE INDEX IX_Banca_Status ON [dbo].[Banca]([Status]);
CREATE INDEX IX_Banca_Mercado ON [dbo].[Banca]([Mercado]);
CREATE INDEX IX_Banca_DataCriacao ON [dbo].[Banca]([DataCriacao]);
GO

CREATE INDEX IX_Operacao_BancaId ON [dbo].[Operacao]([BancaId]);
CREATE INDEX IX_Operacao_Status ON [dbo].[Operacao]([Status]);
CREATE INDEX IX_Operacao_DataHora ON [dbo].[Operacao]([DataHora]);
GO

CREATE INDEX IX_Padrao_Ativo ON [dbo].[Padrao]([Ativo]);
CREATE INDEX IX_Padrao_Mercado ON [dbo].[Padrao]([Mercado]);
GO

-- Inserir configurações iniciais
INSERT INTO [dbo].[ConfiguracaoBBTips] ([Email], [Senha], [UrlBase], [LembrarCredenciais], [AutoLogin])
VALUES ('', NULL, 'https://app.bbtips.com.br', 0, 0);
GO

INSERT INTO [dbo].[ConfiguracaoGeral] ([NotificacoesAtivas], [SomAlerta], [IntervaloAtualizacao], [TemaAplicacao])
VALUES (1, 1, 5, 'Dark');
GO

PRINT 'Banco de dados BBTipsDB criado com sucesso!';
GO
