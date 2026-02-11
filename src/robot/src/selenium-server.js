/**
 * BB Tips Robot - Selenium Server
 * Backend de integração para controle do robô com SSE (Server-Sent Events)
 * Unificado com entry point do robot
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const BBTipsRobo = require('./services/robotService');

// ============================================
// CONFIGURAÇÃO DO ROBÔ
// ============================================
const config = {
    urlBase: process.env.BB_TIPS_URL || 'https://app.bbtips.com.br',
    email: process.env.BB_TIPS_EMAIL || '',
    senha: process.env.BB_TIPS_SENHA || '',
    intervaloVerificacao: parseInt(process.env.INTERVALO_VERIFICACAO) || 30,
    
    buscadorPadroes: {
        parametros: {
            maximoPulos: parseInt(process.env.MAXIMO_PULOS) || 80,
            percentualInicial: parseInt(process.env.PERCENTUAL_INICIAL) || 94,
            totalRegistros: parseInt(process.env.TOTAL_REGISTROS) || 3,
            stakeInicial: parseInt(process.env.STAKE_INICIAL) || 10,
            multiplicador: parseInt(process.env.MULTIPLICADOR) || 3
        }
    }
};

// ============================================
// CONFIGURAÇÃO DO SERVIDOR EXPRESS
// ============================================
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// ============================================
// VARIÁVEIS DE ESTADO DO ROBÔ
// ============================================
let robot = null;
let isRunning = false;
let logs = [];
let lastLogId = 0;

// Cache de dados do robô
const robotCache = {
    data: null,
    lastUpdate: null,
    CACHE_DURATION_MS: 30 * 60 * 1000,
    dadosCards: []
};

// Clientes SSE conectados
const sseClients = new Set();

// ============================================
// FUNÇÕES DE LOGGING
// ============================================
function addLog(level, message, data = null) {
    lastLogId++;
    const logEntry = {
        id: lastLogId,
        timestamp: new Date().toISOString(),
        level,
        message,
        data,
        step: robot ? robot.stepCount : 0
    };
    logs.push(logEntry);
    
    const logData = JSON.stringify(logEntry);
    sseClients.forEach(client => {
        client.write(`data: ${logData}\n\n`);
    });
}

function isCacheExpired() {
    if (!robotCache.lastUpdate) return true;
    return Date.now() - robotCache.lastUpdate.getTime() > robotCache.CACHE_DURATION_MS;
}

// ============================================
// ENDPOINTS DA API
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Endpoint SSE para logs em tempo real
app.get('/api/sse', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ logs: logs.slice(-100) })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
        sseClients.delete(res);
    });
});

// Logs endpoint (HTTP fallback)
app.get('/api/logs', (req, res) => {
    const lastId = parseInt(req.query.lastId) || 0;
    const newLogs = logs.filter(l => l.id > lastId);
    res.json({ logs: newLogs, lastLogId });
});

// Status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        isRunning,
        hasCache: robotCache.data !== null && !isCacheExpired(),
        cacheAge: robotCache.lastUpdate ? Date.now() - robotCache.lastUpdate.getTime() : null,
        cacheExpiresIn: robotCache.lastUpdate ? 
            Math.max(0, robotCache.CACHE_DURATION_MS - (Date.now() - robotCache.lastUpdate.getTime())) : null
    });
});

// Iniciar robô
app.post('/api/robot/start', async (req, res) => {
    if (isRunning) {
        return res.status(400).json({ error: 'Robô já está em execução' });
    }

    const { urlBase, email, senha, timeoutSegundos, modoDebug, tipo } = req.body;
    
    try {
        addLog('INFO', '========================================');
        addLog('INFO', 'BB TIPS ROBOT - INÍCIO DE EXECUÇÃO');
        addLog('INFO', '========================================');
        addLog('INFO', `Timestamp: ${new Date().toISOString()}`);
        addLog('INFO', `Tipo: ${tipo || 'buscador'}`);

        const robotConfig = {
            urlBase: urlBase || process.env.BOT_URL_BASE || 'http://localhost:3000',
            email: email || process.env.BOT_EMAIL || '',
            senha: senha || process.env.BOT_SENHA || '',
            timeoutSegundos: timeoutSegundos || process.env.BOT_TIMEOUT_SEGUNDOS || 30,
            modoDebug: modoDebug || process.env.BOT_MODO_DEBUG === 'true' || false
        };

        addLog('INFO', `URL Base: ${robotConfig.urlBase}`);
        addLog('INFO', 'Inicializando browser...');

        robot = new BBTipsRobo(robotConfig);
        
        robot.addLog = (level, message, data = null) => {
            addLog(level, message, data);
        };

        await robot.init();
        
        addLog('INFO', '========================================');
        addLog('INFO', 'INICIANDO LOGIN');
        addLog('INFO', '========================================');
        
        const loginSuccess = await robot.fazerLogin();
        if (!loginSuccess) {
            addLog('ERROR', 'Falha no login');
            await robot.close();
            isRunning = false;
            robot = null;
            return res.status(400).json({ error: 'Falha no login' });
        }

        isRunning = true;
        addLog('SUCCESS', 'Login realizado com sucesso!');
        
        addLog('INFO', '========================================');
        addLog('INFO', 'EXECUTANDO BUSCADOR DE PADRÕES');
        addLog('INFO', '========================================');
        
        const result = await robot.executarBuscadorTodasTabelas({ parametros: config.buscadorPadroes.parametros });
        
        addLog('INFO', `Total passos: ${robot.stepCount}`);
        addLog('INFO', `Cards extraídos: ${robot.dadosCards?.length || 0}`);
        
        if (result.sucesso) {
            addLog('SUCCESS', 'BUSCADOR CONCLUÍDO COM SUCESSO!');
        } else {
            addLog('ERROR', `Erro no buscador: ${result.erro}`);
        }
        
        res.json({ success: true, processId: Date.now(), result });
    } catch (error) {
        addLog('ERROR', `ERRO: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Executar buscador de padrões
app.post('/api/robot/buscador', async (req, res) => {
    if (!isRunning || !robot) {
        return res.status(400).json({ error: 'Robô não está em execução' });
    }

    const { parametros } = req.body;
    
    try {
        addLog('INFO', 'EXECUTANDO BUSCADOR DE PADRÕES');
        const result = await robot.executarBuscadorTodasTabelas({ parametros });
        res.json(result);
    } catch (error) {
        addLog('ERROR', `Erro ao executar buscador: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Parar robô
app.post('/api/robot/stop', async (req, res) => {
    if (!isRunning || !robot) {
        return res.status(400).json({ error: 'Robô não está em execução' });
    }

    try {
        addLog('INFO', 'Parando robô...');
        
        robotCache.data = {
            logs: [...logs],
            stopTime: new Date(),
            steps: robot.stepCount
        };
        robotCache.lastUpdate = new Date();
        
        if (robot.dadosCards && robot.dadosCards.length > 0) {
            robotCache.dadosCards = robot.dadosCards;
            addLog('INFO', `Cards salvos em cache (${robot.dadosCards.length})`);
        }

        await robot.close();
        isRunning = false;
        robot = null;

        addLog('INFO', 'Robô parado com sucesso');
        res.json({ success: true, cached: true, logsCount: logs.length });
    } catch (error) {
        addLog('ERROR', `Erro ao parar robô: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Obter cache
app.get('/api/cache', (req, res) => {
    if (!robotCache.data || isCacheExpired()) {
        return res.status(404).json({ error: 'Cache expirado ou inexistente' });
    }
    res.json({
        data: robotCache.data,
        cachedAt: robotCache.lastUpdate,
        expiresIn: Math.max(0, robotCache.CACHE_DURATION_MS - (Date.now() - robotCache.lastUpdate.getTime()))
    });
});

// Limpar cache
app.delete('/api/cache', (req, res) => {
    robotCache.data = null;
    robotCache.lastUpdate = null;
    robotCache.dadosCards = [];
    res.json({ success: true });
});

// Obter dados dos cards
app.get('/api/cards', (req, res) => {
    res.json({
        dadosCards: robotCache.dadosCards || [],
        count: (robotCache.dadosCards || []).length
    });
});

// Rota alternativa para compatibilidade
app.get('/api/robot/cards', (req, res) => {
    res.json({
        dadosCards: robotCache.dadosCards || [],
        count: (robotCache.dadosCards || []).length
    });
});

// =========================================
// ENDPOINT: /Bot
// Coletar cards e inserir na base de dados SQL Server
// =========================================
app.get('/Bot', async (req, res) => {
    const executionStartTime = Date.now();
    
    try {
        addLog('INFO', '========================================');
        addLog('INFO', 'ENDPOINT /BOT - INÍCIO');
        addLog('INFO', '========================================');
        
        if (!robotCache.dadosCards || robotCache.dadosCards.length === 0) {
            addLog('ERROR', 'Nenhum dado de cards disponível. Execute o robô primeiro.');
            return res.status(404).json({
                success: false,
                error: 'Nenhum dado de cards disponível. Execute o robô primeiro.'
            });
        }
        
        const totalCards = robotCache.dadosCards.length;
        addLog('INFO', `Cards encontrados: ${totalCards}`);
        
        // Preparar dados para inserção
        const dataHoraBusca = new Date().toISOString();
        const cardsParaInserir = robotCache.dadosCards.map(card => ({
            titulo: card.titulo,
            padroes: card.padroes || '',
            percentual: card.percentual || '',
            sg: card.estatisticas?.SG || 0,
            g1: card.estatisticas?.G1 || 0,
            g2: card.estatisticas?.G2 || 0,
            data_hora_busca: dataHoraBusca
        }));
        
        addLog('INFO', `Tentando inserir ${cardsParaInserir.length} registros`);
        
        // Inserir via API da aplicação principal
        const apiUrl = process.env.API_URL || 'http://localhost:5000';
        
        try {
            const response = await fetch(`${apiUrl}/api/ResultadosCards/inserir-lote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cards: cardsParaInserir })
            });
            
            if (response.ok) {
                const result = await response.json();
                addLog('SUCCESS', `SUCESSO! ${result.registros_inseridos || cardsParaInserir.length} registros inseridos`);
                
                res.json({
                    success: true,
                    message: 'Cards inseridos na base [BBTipsDB].[dbo].[resultados_cards]',
                    registros_inseridos: cardsParaInserir.length,
                    data_hora_coleta: dataHoraBusca,
                    dados: cardsParaInserir
                });
            } else {
                const errorText = await response.text();
                throw new Error(`API retornou status ${response.status}: ${errorText}`);
            }
        } catch (apiError) {
            addLog('ERROR', `FALHA NA INSERÇÃO: ${apiError.message}`);
            addLog('WARN', 'Salvando localmente como fallback...');
            
            // Fallback: Salvar em arquivo JSON
            const dbPath = path.join(__dirname, 'data', 'resultados_cards.json');
            const dataDir = path.dirname(dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            let dadosExistentes = [];
            if (fs.existsSync(dbPath)) {
                try {
                    dadosExistentes = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
                } catch (e) {
                    dadosExistentes = [];
                }
            }
            
            dadosExistentes.push(...cardsParaInserir);
            fs.writeFileSync(dbPath, JSON.stringify(dadosExistentes, null, 2));
            
            addLog('SUCCESS', `SALVAMENTO LOCAL: ${cardsParaInserir.length} registros`);
            
            res.json({
                success: true,
                message: 'Cards salvos localmente (API indisponível)',
                registros_inseridos: cardsParaInserir.length,
                data_hora_coleta: dataHoraBusca,
                dados: cardsParaInserir
            });
        }
        
        const executionTime = Date.now() - executionStartTime;
        addLog('INFO', `Tempo total: ${(executionTime / 1000).toFixed(2)}s`);
        addLog('SUCCESS', 'ENDPOINT /BOT - CONCLUÍDO');
        
    } catch (error) {
        addLog('ERROR', `ERRO: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// =========================================
// ENDPOINT: /simulador
// =========================================
app.get('/simulador', async (req, res) => {
    try {
        addLog('INFO', '========================================');
        addLog('INFO', 'ENDPOINT /SIMULADOR');
        addLog('INFO', '========================================');
        
        const resultado = {
            sucesso: true,
            timestamp: new Date().toISOString(),
            melhores_padroes: [],
            resultados_diarios: [],
            odds_medias: { copa: [], euro: [], premier: [], super: [] },
            estatisticas_consolidadas: {
                total_cards_analisados: 0,
                percentual_medio: 0,
                total_sg: 0,
                total_g1: 0,
                total_g2: 0
            }
        };
        
        const apiUrl = process.env.API_URL || 'http://localhost:5000';
        
        // Buscar melhores padrões
        try {
            const response = await fetch(`${apiUrl}/api/resultados-cards/melhores-padroes`);
            if (response.ok) {
                resultado.melhores_padroes = await response.json();
                addLog('INFO', `${resultado.melhores_padroes.length} melhores padrões carregados`);
            }
        } catch (e) {
            addLog('WARN', `Não foi possível carregar melhores padrões: ${e.message}`);
        }
        
        // Buscar resultados diários
        try {
            const response = await fetch(`${apiUrl}/api/resultados-cards/resultados-diarios`);
            if (response.ok) {
                resultado.resultados_diarios = await response.json();
                addLog('INFO', `${resultado.resultados_diarios.length} resultados diários carregados`);
            }
        } catch (e) {
            addLog('WARN', `Não foi possível carregar resultados diários: ${e.message}`);
        }
        
        // Buscar odds médias
        const tabelasOdds = ['copa', 'euro', 'premier', 'super'];
        for (const tabela of tabelasOdds) {
            try {
                const response = await fetch(`${apiUrl}/api/odds/${tabela}`);
                if (response.ok) {
                    resultado.odds_medias[tabela] = await response.json();
                }
            } catch (e) {
                addLog('WARN', `Não foi possível carregar odds ${tabela}: ${e.message}`);
            }
        }
        
        // Calcular estatísticas
        if (resultado.melhores_padroes.length > 0) {
            const cards = resultado.melhores_padroes;
            const percentuais = cards
                .map(c => parseFloat(c.percentual?.replace('%', '').replace(',', '.') || '0'))
                .filter(p => p > 0);
            
            resultado.estatisticas_consolidadas = {
                total_cards_analisados: cards.length,
                percentual_medio: percentuais.length > 0 
                    ? (percentuais.reduce((a, b) => a + b, 0) / percentuais.length).toFixed(2) 
                    : 0,
                total_sg: cards.reduce((sum, c) => sum + (c.sg || 0), 0),
                total_g1: cards.reduce((sum, c) => sum + (c.g1 || 0), 0),
                total_g2: cards.reduce((sum, c) => sum + (c.g2 || 0), 0)
            };
        }
        
        res.json(resultado);
        
    } catch (error) {
        addLog('ERROR', `Erro no /simulador: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================
// INICIAR SERVIDOR
// =========================================
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Robot API running on port ${PORT}`);
    console.log(`SSE endpoint: http://localhost:${PORT}/api/sse`);
});
