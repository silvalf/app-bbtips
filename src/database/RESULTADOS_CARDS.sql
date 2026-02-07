-- ============================================
-- Script SQL para criar e usar a tabela de resultados dos cards
-- BB Tips - Banco de Dados
-- ============================================

-- Criação da tabela resultados_cards
CREATE TABLE IF NOT EXISTS resultados_cards (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    padroes VARCHAR(50),
    percentual VARCHAR(20),
    sg INT DEFAULT 0,
    g1 INT DEFAULT 0,
    g2 INT DEFAULT 0,
    data_hora_busca TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para pesquisas rápidas por data
CREATE INDEX IF NOT EXISTS idx_resultados_cards_data 
ON resultados_cards(data_hora_busca DESC);

-- Criar índice para pesquisas por título
CREATE INDEX IF NOT EXISTS idx_resultados_cards_titulo 
ON resultados_cards(titulo);

-- ============================================
-- Exemplos de INSERT com dados dos cards
-- ============================================

-- Exemplo 1: Ambos Marcam Sim
INSERT INTO resultados_cards (titulo, padroes, percentual, sg, g1, g2, data_hora_busca)
VALUES (
    'Ambas Marcam Sim (ambs)',
    '21/21',
    '100.00%',
    13,
    7,
    1,
    NOW()
);

-- Exemplo 2: Ambas Marcam Não
INSERT INTO resultados_cards (titulo, padroes, percentual, sg, g1, g2, data_hora_busca)
VALUES (
    'Ambas Marcam Não (ambn)',
    '18/20',
    '90.00%',
    10,
    5,
    3,
    NOW()
);

-- Exemplo 3: Over 2.5 Gols
INSERT INTO resultados_cards (titulo, padroes, percentual, sg, g1, g2, data_hora_busca)
VALUES (
    'Over 2.5 Gols (ov2.5)',
    '22/25',
    '88.00%',
    15,
    6,
    2,
    NOW()
);

-- ============================================
-- Procedures para gerenciar os dados
-- ============================================

-- Procedure para inserir um card
CREATE OR REPLACE PROCEDURE sp_inserir_card(
    p_titulo VARCHAR,
    p_padroes VARCHAR,
    p_percentual VARCHAR,
    p_sg INT,
    p_g1 INT,
    p_g2 INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO resultados_cards (titulo, padroes, percentual, sg, g1, g2)
    VALUES (p_titulo, p_padroes, p_percentual, p_sg, p_g1, p_g2);
END;
$$;

-- Procedure para listar cards por data
CREATE OR REPLACE PROCEDURE sp_listar_por_data(
    p_data_inicio TIMESTAMP,
    p_data_fim TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    SELECT id, titulo, padroes, percentual, sg, g1, g2, data_hora_busca
    FROM resultados_cards
    WHERE data_hora_busca BETWEEN p_data_inicio AND p_data_fim
    ORDER BY data_hora_busca DESC;
END;
$$;

-- ============================================
-- Views para análise dos dados
-- ============================================

-- View para汇总 dos resultados por dia
CREATE OR REPLACE VIEW vw_resultados_diarios AS
SELECT 
    DATE(data_hora_busca) AS data,
    COUNT(*) AS total_cards,
    ROUND(AVG(percentual::numeric), 2) AS percentual_medio,
    SUM(sg) AS total_sg,
    SUM(g1) AS total_g1,
    SUM(g2) AS total_g2
FROM resultados_cards
GROUP BY DATE(data_hora_busca)
ORDER BY data DESC;

-- View para melhores padrões (maior percentual)
CREATE OR REPLACE VIEW vw_melhores_padroes AS
SELECT 
    titulo,
    padroes,
    percentual,
    sg,
    g1,
    g2,
    data_hora_busca,
    ROW_NUMBER() OVER (ORDER BY CAST(SUBSTRING(percentual FROM 1 FOR LENGTH(percentual)-1) AS numeric) DESC) AS rank
FROM resultados_cards
ORDER BY CAST(SUBSTRING(percentual FROM 1 FOR LENGTH(percentual)-1) AS numeric) DESC
LIMIT 20;

-- ============================================
-- Exemplos de SELECT para análise
-- ============================================

-- Listar todos os cards de hoje
SELECT * FROM resultados_cards 
WHERE DATE(data_hora_busca) = CURRENT_DATE
ORDER BY data_hora_busca DESC;

-- Listar cards com percentual acima de 80%
SELECT * FROM resultados_cards 
WHERE CAST(SUBSTRING(percentual FROM 1 FOR LENGTH(percentual)-1) AS numeric) >= 80
ORDER BY CAST(SUBSTRING(percentual FROM 1 FOR LENGTH(percentual)-1) AS numeric) DESC;

-- Contagem de cards por dia (últimos 7 dias)
SELECT 
    DATE(data_hora_busca) AS data,
    COUNT(*) AS total,
    ROUND(AVG(CAST(SUBSTRING(percentual FROM 1 FOR LENGTH(percentual)-1) AS numeric)), 2) AS percentual_medio
FROM resultados_cards
WHERE data_hora_busca >= NOW() - INTERVAL '7 days'
GROUP BY DATE(data_hora_busca)
ORDER BY data DESC;

-- ============================================
-- Função para calcular estatística do card
-- ============================================

CREATE OR REPLACE FUNCTION fc_calcular_score(card_id INT)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    v_percentual NUMERIC;
    v_sg INT;
    v_g1 INT;
    v_g2 INT;
    v_score NUMERIC;
BEGIN
    SELECT 
        CAST(SUBSTRING(percentual FROM 1 FOR LENGTH(percentual)-1) AS numeric),
        sg,
        g1,
        g2
    INTO v_percentual, v_sg, v_g1, v_g2
    FROM resultados_cards
    WHERE id = card_id;
    
    -- Cálculo do score: percentual (70%) + sg (10%) + g1 (10%) + g2 (10%)
    v_score := (v_percentual * 0.70) + (v_sg * 2 * 0.10) + (v_g1 * 2 * 0.10) + (v_g2 * 2 * 0.10);
    
    RETURN ROUND(v_score, 2);
END;
$$;

-- ============================================
-- Exemplo de uso da função
-- ============================================

-- SELECT id, titulo, percentual, sg, g1, g2, 
--        fc_calcular_score(id) AS score
-- FROM resultados_cards
-- ORDER BY score DESC
-- LIMIT 10;

-- ============================================
-- Limpar dados antigos (manter últimos 30 dias)
-- ============================================

-- DELETE FROM resultados_cards 
-- WHERE data_hora_busca < NOW() - INTERVAL '30 days';
