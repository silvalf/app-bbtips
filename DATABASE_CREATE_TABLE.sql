-- Script para criar a tabela ConfiguracaoPerfil
-- Execute no SQL Server Management Studio

USE [BBTipsDB]
GO

-- Se a tabela ConfiguracaoGeral existir, renomeie primeiro
IF OBJECT_ID('dbo.ConfiguracaoGeral', 'U') IS NOT NULL
BEGIN
    EXEC sp_rename 'dbo.ConfiguracaoGeral', 'ConfiguracaoPerfil';
    PRINT 'Tabela renomeada de ConfiguracaoGeral para ConfiguracaoPerfil';
END
ELSE
BEGIN
    -- Criar a tabela se não existir
    CREATE TABLE [dbo].[ConfiguracaoPerfil](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [NotificacoesAtivas] [bit] NOT NULL,
        [SomAlerta] [bit] NOT NULL,
        [IntervaloAtualizacao] [int] NOT NULL,
        [TemaAplicacao] [nvarchar](50) NOT NULL,
        [IniciarComWindows] [bit] NOT NULL,
        [CaminhoBancoDados] [nvarchar](500) NULL,
        [CredencialBBTipsId] [uniqueidentifier] NULL,
        [DataCriacao] [datetime] NOT NULL,
        [DataAtualizacao] [datetime] NOT NULL,
        CONSTRAINT [PK_ConfiguracaoPerfil] PRIMARY KEY CLUSTERED ([Id] ASC)
    );
    
    -- Adicionar valores padrão
    ALTER TABLE [dbo].[ConfiguracaoPerfil] ADD CONSTRAINT [DF_ConfiguracaoPerfil_NotificacoesAtivas] DEFAULT ((1)) FOR [NotificacoesAtivas];
    ALTER TABLE [dbo].[ConfiguracaoPerfil] ADD CONSTRAINT [DF_ConfiguracaoPerfil_SomAlerta] DEFAULT ((1)) FOR [SomAlerta];
    ALTER TABLE [dbo].[ConfiguracaoPerfil] ADD CONSTRAINT [DF_ConfiguracaoPerfil_IntervaloAtualizacao] DEFAULT ((5)) FOR [IntervaloAtualizacao];
    ALTER TABLE [dbo].[ConfiguracaoPerfil] ADD CONSTRAINT [DF_ConfiguracaoPerfil_TemaAplicacao] DEFAULT ('Dark') FOR [TemaAplicacao];
    ALTER TABLE [dbo].[ConfiguracaoPerfil] ADD CONSTRAINT [DF_ConfiguracaoPerfil_IniciarComWindows] DEFAULT ((0)) FOR [IniciarComWindows];
    ALTER TABLE [dbo].[ConfiguracaoPerfil] ADD CONSTRAINT [DF_ConfiguracaoPerfil_DataCriacao] DEFAULT (getdate()) FOR [DataCriacao];
    ALTER TABLE [dbo].[ConfiguracaoPerfil] ADD CONSTRAINT [DF_ConfiguracaoPerfil_DataAtualizacao] DEFAULT (getdate()) FOR [DataAtualizacao];
    
    PRINT 'Tabela ConfiguracaoPerfil criada com sucesso!';
    
    -- Inserir registro inicial
    INSERT INTO [dbo].[ConfiguracaoPerfil] (NotificacoesAtivas, SomAlerta, IntervaloAtualizacao, TemaAplicacao, IniciarComWindows)
    VALUES (1, 1, 5, 'Dark', 0);
    
    PRINT 'Registro inicial inserido!';
END
GO