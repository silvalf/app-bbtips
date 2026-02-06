-- Script para renomear tabela ConfiguracaoGeral para ConfiguracaoPerfil
-- Executar no SQL Server Management Studio

USE [BBTipsDB]
GO

-- Renomear a tabela
EXEC sp_rename 'dbo.ConfiguracaoGeral', 'ConfiguracaoPerfil';
GO

-- Renomear a constraint FK
EXEC sp_rename 'FK_ConfiguracaoGeral_CredencialBBTips', 'FK_ConfiguracaoPerfil_CredencialBBTips';
GO

PRINT 'Tabela renomeada com sucesso de ConfiguracaoGeral para ConfiguracaoPerfil';
GO
