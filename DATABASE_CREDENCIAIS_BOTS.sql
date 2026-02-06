USE [BBTipsDB]
GO

/****** Object:  Table [dbo].[CredenciaisBots]    Script Date: 05/02/2026 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[CredenciaisBots](
	[Id] [uniqueidentifier] NOT NULL,
	[Nome] [nvarchar](100) NOT NULL,
	[Email] [nvarchar](255) NOT NULL,
	[Senha] [nvarchar](500) NULL,
	[UrlBase] [nvarchar](500) NOT NULL,
	[TimeoutSegundos] [int] NOT NULL,
	[ModoDebug] [bit] NOT NULL,
	[EhPrincipal] [bit] NOT NULL,
	[Ativa] [bit] NOT NULL,
	[DataCriacao] [datetime] NOT NULL,
	[DataAtualizacao] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[CredenciaisBots] ADD  DEFAULT (newid()) FOR [Id]
GO

ALTER TABLE [dbo].[CredenciaisBots] ADD  DEFAULT ('https://app.bbtips.com.br') FOR [UrlBase]
GO

ALTER TABLE [dbo].[CredenciaisBots] ADD  DEFAULT ((30)) FOR [TimeoutSegundos]
GO

ALTER TABLE [dbo].[CredenciaisBots] ADD  DEFAULT ((0)) FOR [ModoDebug]
GO

ALTER TABLE [dbo].[CredenciaisBots] ADD  DEFAULT ((0)) FOR [EhPrincipal]
GO

ALTER TABLE [dbo].[CredenciaisBots] ADD  DEFAULT ((1)) FOR [Ativa]
GO

ALTER TABLE [dbo].[CredenciaisBots] ADD  DEFAULT (getdate()) FOR [DataCriacao]
GO

ALTER TABLE [dbo].[CredenciaisBots] ADD  DEFAULT (getdate()) FOR [DataAtualizacao]
GO

PRINT 'Tabela CredenciaisBots criada com sucesso!';
