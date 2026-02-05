-- Script de migração para múltiplas credenciais BB Tips
-- Executar no banco BBTipsDB

-- ============================================
-- Tabela de Credenciais BB Tips (substitui ConfiguracaoBBTips)
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CredencialBBTips')
BEGIN
    CREATE TABLE [dbo].[CredencialBBTips] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [Nome] NVARCHAR(100) NOT NULL,              -- Nome identificador da credencial
        [Email] NVARCHAR(255) NOT NULL,
        [Senha] NVARCHAR(500) NULL,
        [UrlBase] NVARCHAR(500) NOT NULL DEFAULT 'https://app.bbtips.com.br',
        [TimeoutSegundos] INT NOT NULL DEFAULT 30,
        [ModoDebug] BIT NOT NULL DEFAULT 0,
        [EhPrincipal] BIT NOT NULL DEFAULT 0,       -- Define se é a credencial principal
        [Ativa] BIT NOT NULL DEFAULT 1,
        [DataCriacao] DATETIME NOT NULL DEFAULT GETDATE(),
        [DataAtualizacao] DATETIME NOT NULL DEFAULT GETDATE()
    );
    
    PRINT 'Tabela CredencialBBTips criada com sucesso!';
END
ELSE
BEGIN
    PRINT 'Tabela CredencialBBTips já existe.';
END
GO

-- Migração de dados da tabela antiga para a nova (se existir)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ConfiguracaoBBTips')
BEGIN
    IF NOT EXISTS (SELECT * FROM CredencialBBTips)
    BEGIN
        INSERT INTO [dbo].[CredencialBBTips] ([Id], [Nome], [Email], [Senha], [UrlBase], [TimeoutSegundos], [ModoDebug], [EhPrincipal], [Ativa], [DataCriacao], [DataAtualizacao])
        SELECT NEWID(), 'Credencial Padrão', [Email], [Senha], [UrlBase], [TimeoutSegundos], [ModoDebug], 1, 1, [DataCriacao], [DataAtualizacao]
        FROM [dbo].[ConfiguracaoBBTips];
        
        PRINT 'Dados migrados de ConfiguracaoBBTips para CredencialBBTips';
    END
END
GO

-- ============================================
-- Tabela de Configurações Gerais (atualizada)
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ConfiguracaoGeral')
BEGIN
    CREATE TABLE [dbo].[ConfiguracaoGeral] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [NotificacoesAtivas] BIT NOT NULL DEFAULT 1,
        [SomAlerta] BIT NOT NULL DEFAULT 1,
        [IntervaloAtualizacao] INT NOT NULL DEFAULT 5,  -- Segundos para auto-refresh
        [TemaAplicacao] NVARCHAR(50) NOT NULL DEFAULT 'Dark',
        [IniciarComWindows] BIT NOT NULL DEFAULT 0,
        [CaminhoBancoDados] NVARCHAR(500) NULL,
        [CredencialBBTipsId] UNIQUEIDENTIFIER NULL,     -- FK para credencial principal
        [DataCriacao] DATETIME NOT NULL DEFAULT GETDATE(),
        [DataAtualizacao] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_ConfiguracaoGeral_CredencialBBTips FOREIGN KEY ([CredencialBBTipsId]) REFERENCES [CredencialBBTips]([Id])
    );
    
    PRINT 'Tabela ConfiguracaoGeral criada com sucesso!';
END
GO

-- Inserir configuração geral inicial se não existir
IF NOT EXISTS (SELECT * FROM [dbo].[ConfiguracaoGeral])
BEGIN
    INSERT INTO [dbo].[ConfiguracaoGeral] ([NotificacoesAtivas], [SomAlerta], [IntervaloAtualizacao], [TemaAplicacao], [CredencialBBTipsId])
    SELECT 1, 1, 5, 'Dark', [Id] FROM [dbo].[CredencialBBTips] WHERE [EhPrincipal] = 1;
    
    PRINT 'Configuração geral inicial inserida!';
END
GO

-- ============================================
-- Procedures para gerenciamento de credenciais
-- ============================================

-- Procedure: Criar nova credencial
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'sp_CriarCredencialBBTips')
    DROP PROCEDURE sp_CriarCredencialBBTips;
GO

CREATE PROCEDURE sp_CriarCredencialBBTips
    @Nome NVARCHAR(100),
    @Email NVARCHAR(255),
    @Senha NVARCHAR(500) = NULL,
    @UrlBase NVARCHAR(500) = 'https://app.bbtips.com.br',
    @TimeoutSegundos INT = 30,
    @ModoDebug BIT = 0,
    @EhPrincipal BIT = 0,
    @Id UNIQUEIDENTIFIER OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Se for definida como principal, remove flag de principal das outras
    IF @EhPrincipal = 1
    BEGIN
        UPDATE [dbo].[CredencialBBTips] SET [EhPrincipal] = 0 WHERE [EhPrincipal] = 1;
    END
    
    INSERT INTO [dbo].[CredencialBBTips] (
        [Nome], [Email], [Senha], [UrlBase], [TimeoutSegundos], [ModoDebug], [EhPrincipal], [Ativa]
    )
    VALUES (
        @Nome, @Email, @Senha, @UrlBase, @TimeoutSegundos, @ModoDebug, @EhPrincipal, 1
    );
    
    SET @Id = SCOPE_IDENTITY();
END
GO

-- Procedure: Listar todas as credenciais
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'sp_ListarCredenciaisBBTips')
    DROP PROCEDURE sp_ListarCredenciaisBBTips;
GO

CREATE PROCEDURE sp_ListarCredenciaisBBTips
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        [Id],
        [Nome],
        [Email],
        CASE WHEN [Senha] IS NOT NULL THEN 1 ELSE 0 END AS [TemSenha],
        [UrlBase],
        [TimeoutSegundos],
        [ModoDebug],
        [EhPrincipal],
        [Ativa],
        [DataCriacao],
        [DataAtualizacao]
    FROM [dbo].[CredencialBBTips]
    ORDER BY [EhPrincipal] DESC, [DataCriacao] DESC;
END
GO

-- Procedure: Definir credencial como principal
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'sp_DefinirCredencialPrincipal')
    DROP PROCEDURE sp_DefinirCredencialPrincipal;
GO

CREATE PROCEDURE sp_DefinirCredencialPrincipal
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    -- Remove flag de principal de todas
    UPDATE [dbo].[CredencialBBTips] SET [EhPrincipal] = 0;
    
    -- Define nova principal
    UPDATE [dbo].[CredencialBBTips] SET [EhPrincipal] = 1 WHERE [Id] = @Id;
    
    -- Atualiza FK na configuração geral
    UPDATE [dbo].[ConfiguracaoGeral] SET [CredencialBBTipsId] = @Id, [DataAtualizacao] = GETDATE();
    
    COMMIT TRANSACTION;
END
GO

-- Procedure: Excluir credencial
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'sp_ExcluirCredencialBBTips')
    DROP PROCEDURE sp_ExcluirCredencialBBTips;
GO

CREATE PROCEDURE sp_ExcluirCredencialBBTips
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Não permite excluir se for a única credencial
    IF (SELECT COUNT(*) FROM [dbo].[CredencialBBTips]) <= 1
    BEGIN
        RAISERROR('Não é possível excluir a única credencial cadastrada.', 16, 1);
        RETURN;
    END
    
    -- Se for principal, define outra como principal
    IF (SELECT [EhPrincipal] FROM [dbo].[CredencialBBTips] WHERE [Id] = @Id) = 1
    BEGIN
        UPDATE [dbo].[CredencialBBTips] 
        SET [EhPrincipal] = 1 
        WHERE [Id] != @Id AND [Ativa] = 1;
        
        UPDATE [dbo].[ConfiguracaoGeral]
        SET [CredencialBBTipsId] = (SELECT TOP 1 [Id] FROM [dbo].[CredencialBBTips] WHERE [EhPrincipal] = 1);
    END
    
    DELETE FROM [dbo].[CredencialBBTips] WHERE [Id] = @Id;
END
GO

-- Procedure: Atualizar credencial
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'sp_AtualizarCredencialBBTips')
    DROP PROCEDURE sp_AtualizarCredencialBBTips;
GO

CREATE PROCEDURE sp_AtualizarCredencialBBTips
    @Id UNIQUEIDENTIFIER,
    @Nome NVARCHAR(100),
    @Email NVARCHAR(255),
    @Senha NVARCHAR(500) = NULL,
    @UrlBase NVARCHAR(500) = 'https://app.bbtips.com.br',
    @TimeoutSegundos INT = 30,
    @ModoDebug BIT = 0,
    @EhPrincipal BIT = 0,
    @Ativa BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @EhPrincipal = 1
    BEGIN
        UPDATE [dbo].[CredencialBBTips] SET [EhPrincipal] = 0 WHERE [EhPrincipal] = 1;
    END
    
    UPDATE [dbo].[CredencialBBTips]
    SET [Nome] = @Nome,
        [Email] = @Email,
        [Senha] = @Senha,
        [UrlBase] = @UrlBase,
        [TimeoutSegundos] = @TimeoutSegundos,
        [ModoDebug] = @ModoDebug,
        [EhPrincipal] = @EhPrincipal,
        [Ativa] = @Ativa,
        [DataAtualizacao] = GETDATE()
    WHERE [Id] = @Id;
END
GO

-- Procedure: Obter credencial por ID
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'sp_ObterCredencialBBTips')
    DROP PROCEDURE sp_ObterCredencialBBTips;
GO

CREATE PROCEDURE sp_ObterCredencialBBTips
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        [Id],
        [Nome],
        [Email],
        [Senha],
        [UrlBase],
        [TimeoutSegundos],
        [ModoDebug],
        [EhPrincipal],
        [Ativa],
        [DataCriacao],
        [DataAtualizacao]
    FROM [dbo].[CredencialBBTips]
    WHERE [Id] = @Id;
END
GO

-- Procedure: Obter credencial principal
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'sp_ObterCredencialPrincipal')
    DROP PROCEDURE sp_ObterCredencialPrincipal;
GO

CREATE PROCEDURE sp_ObterCredencialPrincipal
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1
        [Id],
        [Nome],
        [Email],
        [Senha],
        [UrlBase],
        [TimeoutSegundos],
        [ModoDebug],
        [EhPrincipal],
        [Ativa],
        [DataCriacao],
        [DataAtualizacao]
    FROM [dbo].[CredencialBBTips]
    WHERE [EhPrincipal] = 1 AND [Ativa] = 1
    ORDER BY [DataAtualizacao] DESC;
END
GO

PRINT 'Migração concluída com sucesso!';
GO
