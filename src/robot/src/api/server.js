/**
 * BB Tips Robot API
 * Backend de integração para controle do robô com SSE (Server-Sent Events)
 */

const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { BBTipsRobo } = require('../services/robotService');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Variáveis de estado do robô
let robot = null;
let isRunning = false;
let logs = [];
let lastLogId = 0;

// Cache de dados do robô
const robotCache = {
    data: null,
    lastUpdate: null,
    CACHE_DURATION_MS: 30 * 60 * 1000, // 30 minutos
    dadosCards: [] // Armazenar dados dos cards extraídos
};

// Clientes SSE conectados
const sseClients = new Set();

// Função para adicionar log e enviar para todos os clientes SSE
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
    
    // Enviar para todos os clientes SSE
    const logData = JSON.stringify(logEntry);
    sseClients.forEach(client => {
        client.write(`data: ${logData}\n\n`);
    });
}

// Endpoint SSE para logs em tempo real
app.get('/api/sse', (req, res) => {
    // Configurar headers para SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    // Enviar logs existentes
    res.write(`data: ${JSON.stringify({ logs: logs.slice(-100) })}\n\n`);

    // Adicionar cliente à lista
    sseClients.add(res);
    console.log('Novo cliente SSE conectado. Total:', sseClients.size);

    // Remover cliente quando desconectar
    req.on('close', () => {
        sseClients.delete(res);
        console.log('Cliente SSE desconectado. Total:', sseClients.size);
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
        addLog('INFO', '╔══════════════════════════════════════════════════════════╗');
        addLog('INFO', '║          BB TIPS ROBOT - INÍCIO DE EXECUÇÃO            ║');
        addLog('INFO', '╚══════════════════════════════════════════════════════════╝');
        addLog('INFO', `Timestamp de início: ${new Date().toISOString()}`);
        addLog('INFO', `Tipo de execução: ${tipo || 'buscador'}`);

        // Criar configuração do robô com os parâmetros recebidos
        const config = {
            urlBase: urlBase || process.env.BOT_URL_BASE || 'http://localhost:3000',
            email: email || process.env.BOT_EMAIL || '',
            senha: senha || process.env.BOT_SENHA || '',
            timeoutSegundos: timeoutSegundos || process.env.BOT_TIMEOUT_SEGUNDOS || 30,
            modoDebug: modoDebug || process.env.BOT_MODO_DEBUG === 'true' || false
        };

        addLog('INFO', '═══════════════════════════════════════════════════════════');
        addLog('INFO', 'CONFIGURAÇÃO DO ROBÔ:');
        addLog('INFO', `  URL Base: ${config.urlBase}`);
        addLog('INFO', `  Email: ${config.email ? '****@***.***' : 'NÃO CONFIGURADO'}`);
        addLog('INFO', `  Timeout: ${config.timeoutSegundos}s`);
        addLog('INFO', `  Debug: ${config.modoDebug}`);
        addLog('INFO', '═══════════════════════════════════════════════════════════');
        addLog('INFO', 'Inicializando browser...');

        robot = new BBTipsRobo(config);
        
        // Sobrescrever método addLog do robô para emitir via SSE
        robot.addLog = (level, message, data = null) => {
            addLog(level, message, data);
        };

        // Inicializar navegador
        await robot.init();
        
        // Fazer login
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
        
        // =========================================
        // EXECUTAR BUSCADOR DE PADRÕES AUTOMATICAMENTE
        // =========================================
        addLog('INFO', '========================================');
        addLog('INFO', 'EXECUTANDO BUSCADOR DE PADRÕES');
        addLog('INFO', '========================================');
        
        const parametrosDefault = {
            maximoPulos: 80,
            percentualInicial: 50,
            totalRegistros: 50,
            stakeInicial: 10,
            multiplicador: 1.5
        };
        
        const result = await robot.executarBuscadorPadroes({ parametros: parametrosDefault });
        
        // Log de estatísticas da execução
        addLog('INFO', '═══════════════════════════════════════════════════════════');
        addLog('INFO', 'ESTATÍSTICAS DA EXECUÇÃO:');
        addLog('INFO', `  Total de passos: ${robot.stepCount}`);
        addLog('INFO', `  Cards extraídos: ${robot.dadosCards?.length || 0}`);
        addLog('INFO', `  Timestamp de conclusão: ${new Date().toISOString()}`);
        
        if (result.sucesso) {
            addLog('SUCCESS', 'BUSCADOR DE PADRÕES CONCLUÍDO COM SUCESSO!');
        } else {
            addLog('ERROR', `Erro no buscador: ${result.erro}`);
        }
        
        addLog('SUCCESS', '╔══════════════════════════════════════════════════════════╗');
        addLog('SUCCESS', '║          BB TIPS ROBOT - EXECUÇÃO CONCLUÍDA            ║');
        addLog('SUCCESS', '╚══════════════════════════════════════════════════════════╝');
        
        res.json({ success: true, processId: Date.now(), result });
    } catch (error) {
        addLog('ERROR', '╔══════════════════════════════════════════════════════════╗');
        addLog('ERROR', '║          BB TIPS ROBOT - ERRO NA EXECUÇÃO              ║');
        addLog('ERROR', '╚══════════════════════════════════════════════════════════╝');
        addLog('ERROR', `Erro: ${error.message}`);
        addLog('ERROR', `Timestamp do erro: ${new Date().toISOString()}`);
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
        addLog('INFO', '========================================');
        addLog('INFO', 'EXECUTANDO BUSCADOR DE PADROES');
        addLog('INFO', '========================================');
        
        const result = await robot.executarBuscadorPadroes({ parametros });
        
        if (result.sucesso) {
            addLog('SUCCESS', 'BUSCADOR DE PADROES CONCLUIDO COM SUCESSO!');
        } else {
            addLog('ERROR', `Erro no buscador: ${result.erro}`);
        }
        
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
        addLog('INFO', 'Parando robô pelo usuário');
        
        // Salvar dados no cache
        robotCache.data = {
            logs: [...logs],
            stopTime: new Date(),
            steps: robot.stepCount
        };
        robotCache.lastUpdate = new Date();
        
        // Salvar dados dos cards se disponíveis
        if (robot.dadosCards && robot.dadosCards.length > 0) {
            robotCache.dadosCards = robot.dadosCards;
            addLog('INFO', `Dados dos cards salvos em cache (${robot.dadosCards.length} cards)`);
        }
        
        addLog('INFO', `Dados salvos em cache (${logs.length} logs)`);
        addLog('INFO', `Cache valido por 30 minutos`);

        await robot.close();
        isRunning = false;
        robot = null;

        addLog('INFO', 'Robô parado com sucesso');
        res.json({ success: true, cached: true, logsCount: logs.length });
    } catch (error) {
        addLog('ERROR', `Erro ao parar robo: ${error.message}`);
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

// Obter dados dos cards extraídos
app.get('/api/cards', (req, res) => {
    res.json({
        dadosCards: robotCache.dadosCards || [],
        count: (robotCache.dadosCards || []).length
    });
});

// Rota alternativa para compatibilidade com API web
app.get('/api/robot/cards', (req, res) => {
    res.json({
        dadosCards: robotCache.dadosCards || [],
        count: (robotCache.dadosCards || []).length
    });
});

// =========================================
// ENDPOINT: /padroes
// Coletar cards e inserir na base de dados SQL Server
// Com logging detalhado em tempo real
// =========================================
app.get('/padroes', async (req, res) => {
    const executionStartTime = Date.now();
    
    try {
        addLog('INFO', '╔══════════════════════════════════════════════════════════╗');
        addLog('INFO', '║          ENDPOINT /PADROES - INÍCIO DE EXECUÇÃO          ║');
        addLog('INFO', '╚══════════════════════════════════════════════════════════╝');
        addLog('INFO', `Timestamp: ${new Date().toISOString()}`);
        
        // Verificar se há dados em cache
        if (!robotCache.dadosCards || robotCache.dadosCards.length === 0) {
            addLog('ERROR', 'Nenhum dado de cards disponível. Execute o robô primeiro.');
            return res.status(404).json({
                success: false,
                error: 'Nenhum dado de cards disponível. Execute o robô primeiro.'
            });
        }
        
        const totalCards = robotCache.dadosCards.length;
        addLog('INFO', `═══════════════════════════════════════════════════════════`);
        addLog('INFO', `COLETA DE CARDS: ${totalCards} cards encontrados`);
        addLog('INFO', `═══════════════════════════════════════════════════════════`);
        
        // Log de cada card coletado
        robotCache.dadosCards.forEach((card, index) => {
            addLog('INFO', `  [${index + 1}/${totalCards}] Card coletado:`);
            addLog('INFO', `      Título: ${card.titulo || 'N/A'}`);
            addLog('INFO', `      Padrões: ${card.padroes || 'N/A'}`);
            addLog('INFO', `      Percentual: ${card.percentual || 'N/A'}`);
            addLog('INFO', `      SG: ${card.estatisticas?.SG || 0} | G1: ${card.estatisticas?.G1 || 0} | G2: ${card.estatisticas?.G2 || 0}`);
        });
        
        // Preparar dados para inserção via API da aplicação
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
        
        addLog('INFO', '═══════════════════════════════════════════════════════════');
        addLog('INFO', `INSERÇÃO NO BANCO: Tentando inserir ${cardsParaInserir.length} registros`);
        addLog('INFO', `Data/Hora da coleta: ${dataHoraBusca}`);
        addLog('INFO', '═══════════════════════════════════════════════════════════');
        
        // Inserir via API da aplicação principal
        const apiUrl = process.env.API_URL || 'http://localhost:5000';
        
        try {
            addLog('INFO', `Conectando com API: ${apiUrl}/api/resultados-cards/inserir-lote`);
            
            const response = await fetch(`${apiUrl}/api/resultados-cards/inserir-lote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cards: cardsParaInserir })
            });
            
            if (response.ok) {
                const result = await response.json();
                addLog('SUCCESS', '✓ SUCESSO NA INSERÇÃO NO SQL SERVER');
                addLog('INFO', `  Registros inseridos: ${result.registros_inseridos || cardsParaInserir.length}`);
                addLog('INFO', `  Mensagem: ${result.message}`);
                
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
            addLog('ERROR', '✗ FALHA NA INSERÇÃO VIA API');
            addLog('ERROR', `  Erro: ${apiError.message}`);
            addLog('WARN', '  Salvando localmente como fallback...');
            
            // Fallback: Salvar em arquivo JSON
            const dbPath = path.join(__dirname, '..', 'data', 'resultados_cards.json');
            const dataDir = path.dirname(dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            let dadosExistentes = [];
            if (fs.existsSync(dbPath)) {
                try {
                    const conteudo = fs.readFileSync(dbPath, 'utf8');
                    dadosExistentes = JSON.parse(conteudo);
                } catch (e) {
                    dadosExistentes = [];
                }
            }
            
            dadosExistentes.push(...cardsParaInserir);
            fs.writeFileSync(dbPath, JSON.stringify(dadosExistentes, null, 2));
            
            addLog('SUCCESS', `✓ SUCESSO NO SALVAMENTO LOCAL (FALLBACK)`);
            addLog('INFO', `  Arquivo: ${dbPath}`);
            addLog('INFO', `  Registros salvos: ${cardsParaInserir.length}`);
            
            res.json({
                success: true,
                message: 'Cards salvos localmente (API indisponível)',
                registros_inseridos: cardsParaInserir.length,
                data_hora_coleta: dataHoraBusca,
                dados: cardsParaInserir
            });
        }
        
        // Log de estatísticas finais
        const executionTime = Date.now() - executionStartTime;
        addLog('INFO', '═══════════════════════════════════════════════════════════');
        addLog('INFO', 'ESTATÍSTICAS DE EXECUÇÃO');
        addLog('INFO', '═══════════════════════════════════════════════════════════');
        addLog('INFO', `  Cards processados: ${totalCards}`);
        addLog('INFO', `  Tempo total: ${(executionTime / 1000).toFixed(2)}s`);
        addLog('INFO', `  Timestamp final: ${new Date().toISOString()}`);
        addLog('SUCCESS', '╔══════════════════════════════════════════════════════════╗');
        addLog('SUCCESS', '║          ENDPOINT /PADROES - EXECUÇÃO CONCLUÍDA         ║');
        addLog('SUCCESS', '╚══════════════════════════════════════════════════════════╝');
        
    } catch (error) {
        addLog('ERROR', '╔══════════════════════════════════════════════════════════╗');
        addLog('ERROR', '║          ENDPOINT /PADROES - ERRO NA EXECUÇÃO           ║');
        addLog('ERROR', '╚══════════════════════════════════════════════════════════╝');
        addLog('ERROR', `Erro: ${error.message}`);
        addLog('ERROR', `Timestamp: ${new Date().toISOString()}`);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// =========================================
// ENDPOINT: /simulador
// Cálculos e estatísticas - busca dados da API principal
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
            odds_medias: {
                copa: [],
                euro: [],
                premier: [],
                super: []
            },
            estatisticas_consolidadas: {
                total_cards_analisados: 0,
                percentual_medio: 0,
                total_sg: 0,
                total_g1: 0,
                total_g2: 0
            }
        };
        
        // Buscar dados da API principal
        const apiUrl = process.env.API_URL || 'http://localhost:5000';
        
        // Buscar melhores padrões da view
        try {
            const response = await fetch(`${apiUrl}/api/resultados-cards/melhores-padroes`);
            if (response.ok) {
                const data = await response.json();
                resultado.melhores_padroes = data || [];
                addLog('INFO', `${resultado.melhores_padroes.length} melhores padrões carregados`);
            }
        } catch (e) {
            addLog('WARN', `Não foi possível carregar melhores padrões: ${e.message}`);
        }
        
        // Buscar resultados diários da view
        try {
            const response = await fetch(`${apiUrl}/api/resultados-cards/resultados-diarios`);
            if (response.ok) {
                const data = await response.json();
                resultado.resultados_diarios = data || [];
                addLog('INFO', `${resultado.resultados_diarios.length} resultados diários carregados`);
            }
        } catch (e) {
            addLog('WARN', `Não foi possível carregar resultados diários: ${e.message}`);
        }
        
        // Buscar odds médias das tabelas
        const tabelasOdds = ['copa', 'euro', 'premier', 'super'];
        for (const tabela of tabelasOdds) {
            try {
                const response = await fetch(`${apiUrl}/api/odds/${tabela}`);
                if (response.ok) {
                    const data = await response.json();
                    resultado.odds_medias[tabela] = data || [];
                }
            } catch (e) {
                addLog('WARN', `Não foi possível carregar odds ${tabela}: ${e.message}`);
            }
        }
        
        // Calcular estatísticas consolidadas a partir dos melhores padrões
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
        
        // Fallback: ler dados locais se API não disponível
        const dbPath = path.join(__dirname, '..', 'data', 'resultados_cards.json');
        if (fs.existsSync(dbPath) && resultado.melhores_padroes.length === 0) {
            try {
                const dados = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
                
                if (dados.length > 0) {
                    dados.sort((a, b) => {
                        const pa = parseFloat(a.percentual?.replace('%', '').replace(',', '.') || '0');
                        const pb = parseFloat(b.percentual?.replace('%', '').replace(',', '.') || '0');
                        return pb - pa;
                    });
                    
                    resultado.melhores_padroes = dados.slice(0, 20).map((d, index) => ({
                        titulo: d.titulo,
                        padroes: d.padroes,
                        percentual: d.percentual,
                        sg: d.sg,
                        g1: d.g1,
                        g2: d.g2,
                        data_hora_busca: d.data_hora_busca,
                        rank: index + 1
                    }));
                    
                    // Calcular estatísticas
                    const percentuais = dados
                        .map(d => parseFloat(d.percentual?.replace('%', '').replace(',', '.') || '0'))
                        .filter(p => p > 0);
                    
                    resultado.estatisticas_consolidadas = {
                        total_cards_analisados: dados.length,
                        percentual_medio: percentuais.length > 0 
                            ? (percentuais.reduce((a, b) => a + b, 0) / percentuais.length).toFixed(2) 
                            : 0,
                        total_sg: dados.reduce((sum, d) => sum + (d.sg || 0), 0),
                        total_g1: dados.reduce((sum, d) => sum + (d.g1 || 0), 0),
                        total_g2: dados.reduce((sum, d) => sum + (d.g2 || 0), 0)
                    };
                    
                    addLog('INFO', `Dados locais carregados: ${dados.length} cards`);
                }
            } catch (e) {
                addLog('WARN', `Erro ao ler dados locais: ${e.message}`);
            }
        }
        
        res.json(resultado);
        
    } catch (error) {
        addLog('ERROR', `Erro no endpoint /simulador: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
});

function isCacheExpired() {
    if (!robotCache.lastUpdate) return true;
    return Date.now() - robotCache.lastUpdate.getTime() > robotCache.CACHE_DURATION_MS;
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Robot API running on port ${PORT}`);
    console.log(`SSE endpoint: http://localhost:${PORT}/api/sse`);
});
