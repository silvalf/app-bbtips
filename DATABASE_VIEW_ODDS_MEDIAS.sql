-- View para obter odds médias de partidas de futebol (Copa do Mundo)
-- Execute este script no banco de dados SQL Server

CREATE VIEW dbo.vw_odds_medias_fut_copa AS
SELECT 
    o.id,
    c.nome AS nome_campeonato,
    m.nome AS time_mandante,
    v.nome AS time_visitante,
    o.data_evento,
    
    -- Odds principais
    AVG(CASE WHEN t.nome_tipo_odd = 'Vitoria Mandante' THEN o.valor_odd END) AS odd_vitoria_mandante,
    AVG(CASE WHEN t.nome_tipo_odd = 'Empate' THEN o.valor_odd END) AS odd_empate,
    AVG(CASE WHEN t.nome_tipo_odd = 'Vitoria Visitante' THEN o.valor_odd END) AS odd_vitoria_visitante,
    
    -- Over/Under
    AVG(CASE WHEN t.nome_tipo_odd = 'Over 2.5 Gols' THEN o.valor_odd END) AS odd_over_25,
    AVG(CASE WHEN t.nome_tipo_odd = 'Under 2.5 Gols' THEN o.valor_odd END) AS odd_under_25,
    
    -- Ambos Marcam
    AVG(CASE WHEN t.nome_tipo_odd = 'Ambos Marcam - Sim' THEN o.valor_odd END) AS odd_ambos_marcam_sim,
    AVG(CASE WHEN t.nome_tipo_odd = 'Ambos Marcam - Não' THEN o.valor_odd END) AS odd_ambos_marcam_nao,
    
    o.created_at
FROM 
    dbo.odds o
INNER JOIN dbo.campeoes c ON o.id_campeonato = c.id
INNER JOIN dbo.times m ON o.id_time_mandante = m.id
INNER JOIN dbo.times v ON o.id_time_visitante = v.id
INNER JOIN dbo.tipos_odd t ON o.id_tipo_odd = t.id
WHERE 
    c.nome LIKE '%Copa do Mundo%'  -- Filtrar apenas Copa do Mundo
    AND o.data_evento >= GETDATE()  -- Apenas partidas futuras
GROUP BY 
    o.id,
    c.nome,
    m.nome,
    v.nome,
    o.data_evento,
    o.created_at;

-- Exemplo de dados de teste (caso a view não tenha dados)
INSERT INTO dbo.vw_odds_medias_fut_copa (id, nome_campeonato, time_mandante, time_visitante, data_evento, odd_vitoria_mandante, odd_empate, odd_vitoria_visitante, odd_over_25, odd_under_25, odd_ambos_marcam_sim, odd_ambos_marcam_nao)
VALUES 
(1, 'Copa do Mundo 2026', 'Brasil', 'Argentina', '2026-06-15 16:00:00', 2.15, 3.20, 3.40, 1.95, 1.85, 1.80, 2.00),
(2, 'Copa do Mundo 2026', 'França', 'Alemanha', '2026-06-15 20:00:00', 2.30, 3.10, 3.10, 1.90, 1.90, 1.75, 2.10),
(3, 'Copa do Mundo 2026', 'Inglaterra', 'Espanha', '2026-06-16 16:00:00', 2.45, 3.00, 2.90, 1.85, 1.95, 1.70, 2.15),
(4, 'Copa do Mundo 2026', 'Portugal', 'Holanda', '2026-06-16 20:00:00', 2.60, 3.10, 2.70, 1.95, 1.85, 1.85, 1.95),
(5, 'Copa do Mundo 2026', 'Itália', 'Bélgica', '2026-06-17 16:00:00', 2.20, 3.15, 3.25, 1.92, 1.88, 1.78, 2.05);
