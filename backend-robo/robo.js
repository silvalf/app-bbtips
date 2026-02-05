/**
 * Robô de Automação BB Tips com Puppeteer
 * Faz scraping/login no sistema BB Tips e executa estratégias
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuração
const SCREENSHOT_DIR = 'c:\\temp\\bbtips_screenshots';
const API_BASE_URL = 'http://127.0.0.1:8000';

// Criar diretório de screenshots se não existir
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Cores para console
const colors = {
    INFO: '📘',
    SUCCESS: '✅',
    WARNING: '⚠️',
    ERROR: '❌',
    DEBUG: '🔍',
    LOGIN: '🔐',
    CYCLE: '🔄'
};

class BBTipsRobo {
    constructor(config) {
        this.config = config;
        this.browser = null;
        this.page = null;
        this.isRunning = false;
        this.logs = [];
        this.logCallback = null;
    }

    /**
     * Adiciona um log
     */
    addLog(level, message, details = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            details,
            source: 'RoboBBTips'
        };
        this.logs.push(logEntry);
        
        // Limitar a 1000 logs
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-1000);
        }

        // Log no console
        console.log(`[${logEntry.timestamp}] [${level}] ${message}`);
        if (details) {
            console.log(`   📋 Detalhes: ${details}`);
        }

        // Callback para o backend
        if (this.logCallback) {
            this.logCallback(logEntry);
        }
    }

    /**
     * Define callback para enviar logs para o backend
     */
    setLogCallback(callback) {
        this.logCallback = callback;
    }

    /**
     * Gera nome do arquivo de screenshot
     */
    generateFilename(step) {
        const timestamp = new Date().format('YYYYMMDD_HHMMSS');
        return path.join(SCREENSHOT_DIR, `${step}_${timestamp}.png`);
    }

    /**
     * Tira um screenshot da página
     */
    async takeScreenshot(step, description) {
        try {
            if (this.page) {
                const filename = this.generateFilename(step);
                await this.page.screenshot({ 
                    path: filename, 
                    fullPage: true 
                });
                this.addLog('INFO', `📸 Screenshot salvo: ${filename}`);
                return filename;
            }
        } catch (error) {
            this.addLog('WARNING', `⚠️ Não foi possível tirar screenshot: ${error.message}`);
        }
        return null;
    }

    /**
     * Inicializa o browser
     */
    async initBrowser() {
        this.addLog('INFO', '🌐 Inicializando browser (Puppeteer)...');
        
        try {
            this.browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--window-size=1920,1080'
                ]
            });
            
            this.page = await this.browser.newPage();
            
            // Configurar viewport
            await this.page.setViewport({ width: 1920, height: 1080 });
            
            // Interceptar requests para debug
            this.page.on('request', request => {
                this.addLog('DEBUG', `📡 Request: ${request.url()}`);
            });

            this.page.on('response', response => {
                if (response.status() >= 400) {
                    this.addLog('WARNING', `⚠️ Response Error: ${response.status()} - ${response.url()}`);
                }
            });

            this.addLog('SUCCESS', '✅ Browser inicializado com sucesso');
        } catch (error) {
            this.addLog('ERROR', `💥 Erro ao inicializar browser: ${error.message}`);
            throw error;
        }
    }

    /**
     * Fecha o browser
     */
    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.addLog('INFO', '🔒 Browser fechado');
            this.browser = null;
            this.page = null;
        }
    }

    /**
     * Faz login no BB Tips
     */
    async fazerLogin() {
        this.addLog('LOGIN', '🔐 Iniciando processo de login...');
        this.addLog('DEBUG', `📧 Email: ${this.config.email}`);
        this.addLog('DEBUG', `🌐 URL: ${this.config.urlBase}/login`);

        // Screenshot antes do login
        await this.takeScreenshot('login_inicio', 'Página de login do BB Tips');

        try {
            // Navegar para a página de login
            this.addLog('INFO', '📡 Navegando para página de login...');
            await this.page.goto(`${this.config.urlBase}/login`, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Aguardar carregamento da página
            await this.page.waitForSelector('body', { timeout: 10000 });
            await this.sleep(2000); // Aguardar renderização

            // Screenshot da página carregada
            await this.takeScreenshot('login_pagina_carregada', 'Página de login carregada');

            // Encontrar e preencher o campo de email
            this.addLog('INFO', '📝 Procurando campo de email...');
            
            // Seletores para o campo de email (do mais específico ao mais genérico)
            const emailSelectors = [
                'input[type="email"]',
                'input[name="email"]',
                'input[id="email"]',
                'input[class*="email"]',
                'input[placeholder*="email"]',
                'input[placeholder*="E-mail"]',
                'input[autocomplete="email"]',
                '#login-email input',
                '.login-form input[type="text"]',
                'form input[type="text"]:first-of-type',
                'input' // Último recurso - primeiro input encontrado
            ];
            
            let emailField = null;
            for (const selector of emailSelectors) {
                try {
                    emailField = await this.page.$(selector);
                    if (emailField) {
                        this.addLog('SUCCESS', `✅ Campo de email encontrado com seletor: ${selector}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (emailField) {
                // Limpar e preencher email
                await emailField.click({ clickCount: 3 });
                await emailField.press('Backspace');
                await this.page.type(selector, this.config.email, { delay: 100 });
                this.addLog('SUCCESS', '✅ Email preenchido');
            } else {
                throw new Error('Campo de email não encontrado');
            }

            // Encontrar e preencher o campo de senha
            this.addLog('INFO', '🔑 Procurando campo de senha...');
            
            const passwordSelectors = [
                'input[type="password"]',
                'input[name="password"]',
                'input[id="password"]',
                'input[class*="password"]',
                'input[placeholder*="senha"]',
                'input[placeholder*="Senha"]',
                'input[autocomplete="current-password"]',
                '#login-password input',
                '.login-form input[type="password"]',
                'form input[type="password"]'
            ];
            
            let passwordField = null;
            for (const selector of passwordSelectors) {
                try {
                    passwordField = await this.page.$(selector);
                    if (passwordField) {
                        this.addLog('SUCCESS', `✅ Campo de senha encontrado com seletor: ${selector}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (passwordField) {
                await passwordField.click({ clickCount: 3 });
                await passwordField.press('Backspace');
                await this.page.type(selector, this.config.senha, { delay: 100 });
                this.addLog('SUCCESS', '✅ Senha preenchida');
            } else {
                throw new Error('Campo de senha não encontrado');
            }

            // Screenshot após preencher credenciais
            await this.takeScreenshot('login_preenchido', 'Credenciais preenchidas');

            // Encontrar e clicar no botão de login
            this.addLog('INFO', '🔘 Procurando botão de login...');
            
            const buttonSelectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:contains("Entrar")',
                'button:contains("LOGIN")',
                'button:contains("Login")',
                'button[class*="login"]',
                'button[class*="btn-primary"]',
                'button[class*="btn-login"]',
                '.login-form button',
                '.btn-primary',
                'button[type="button"]:first-of-type',
                'button' // Último recurso - primeiro botão encontrado
            ];
            
            let loginButton = null;
            for (const selector of buttonSelectors) {
                try {
                    if (selector.includes(':contains')) {
                        // Para seletores com contains, usar avaliação de JavaScript
                        loginButton = await this.page.$x(`//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'entrar')]`);
                        if (loginButton && loginButton.length > 0) {
                            this.addLog('SUCCESS', `✅ Botão de login encontrado por texto`);
                            break;
                        }
                    } else {
                        loginButton = await this.page.$(selector);
                        if (loginButton) {
                            this.addLog('SUCCESS', `✅ Botão de login encontrado com seletor: ${selector}`);
                            break;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (loginButton) {
                this.addLog('INFO', '🔘 Clicando no botão de login...');
                await Promise.all([
                    this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
                    loginButton.click()
                ]);
            } else {
                throw new Error('Botão de login não encontrado');
            }

            // Screenshot após login
            await this.takeScreenshot('login_resultado', 'Resultado do login');

            // Verificar se login foi bem-sucedido
            await this.sleep(3000); // Aguardar carregamento
            const pageContent = await this.page.content();
            const currentUrl = this.page.url();
            
            this.addLog('INFO', `📍 URL atual após login: ${currentUrl}`);
            
            if (pageContent.includes('dashboard') || 
                pageContent.includes('Bem-vindo') || 
                pageContent.includes('logout') || 
                pageContent.includes('sair') ||
                !currentUrl.includes('/login')) {
                this.addLog('SUCCESS', '✅ Login realizado com sucesso!');
                return true;
            } else {
                this.addLog('ERROR', '❌ Login falhou - página não contém indicadores de sucesso');
                await this.takeScreenshot('login_falha', 'Falha no login');
                return false;
            }

        } catch (error) {
            this.addLog('ERROR', `💥 Erro durante login: ${error.message}`);
            await this.takeScreenshot('login_erro', `Erro no login: ${error.message}`);
            return false;
        }
    }

    /**
     * Verifica estratégias ativas
     */
    async verificarEstrategias() {
        this.addLog('INFO', '📊 Verificando estratégias ativas...');

        const estrategias = this.config.estrategiasAtivas;

        if (!estrategias || estrategias.length === 0) {
            this.addLog('WARNING', '⚠️ Nenhuma estratégia ativa configurada');
            this.addLog('INFO', '💡 Dica: Configure estratégias para ativar o monitoramento automático');
            return;
        }

        this.addLog('SUCCESS', `✅ Encontradas ${estrategias.length} estratégias ativas!`);
        estrategias.forEach((estrategia, index) => {
            this.addLog('DEBUG', `  ${index + 1}. ${estrategia}`);
        });
    }

    /**
     * Verifica oportunidades de apostas
     */
    async verificarOportunidades() {
        this.addLog('INFO', '🔍 Verificando oportunidades de apostas...');

        // TODO: Implementar scraping de oportunidades
        const oportunidades = [];

        if (oportunidades.length === 0) {
            this.addLog('INFO', '📭 Nenhuma oportunidade encontrada neste ciclo');
        } else {
            this.addLog('SUCCESS', `🎯 Encontradas ${oportunidades.length} oportunidades!`);
            oportunidades.forEach(opp => {
                this.addLog('DEBUG', `  - Oportunidade: ${opp}`);
            });
        }
    }

    /**
     * Loop principal do robô
     */
    async executarLoopPrincipal() {
        let ciclo = 0;

        while (this.isRunning) {
            ciclo++;
            this.addLog('CYCLE', '═══════════════════════════════════════════');
            this.addLog('CYCLE', `🚀 Iniciando ciclo #${ciclo}`);
            this.addLog('CYCLE', '═══════════════════════════════════════════');

            // Screenshot do início do ciclo
            await this.takeScreenshot(`ciclo_${ciclo}_inicio`, `Início do ciclo #${ciclo}`);

            try {
                // 1. Verificar autenticação
                this.addLog('INFO', '📋 Etapa 1: Verificando autenticação...');
                
                // Verificar se ainda está logado
                const pageContent = await this.page.content();
                const isLoggedIn = pageContent.includes('dashboard') || pageContent.includes('logout') || pageContent.includes('sair');
                
                if (!isLoggedIn) {
                    this.addLog('WARNING', '⚠️ Sessão expirada, fazendo login novamente...');
                    const loginSuccess = await this.fazerLogin();
                    if (!loginSuccess) {
                        this.addLog('WARNING', '⚠️ Falha no login, aguardando próximo ciclo');
                        await this.sleep(this.config.intervaloVerificacao * 1000);
                        continue;
                    }
                } else {
                    this.addLog('SUCCESS', '✅ Já está logado');
                }

                // 2. Verificar estratégias
                this.addLog('INFO', '📋 Etapa 2: Verificando estratégias...');
                await this.verificarEstrategias();

                // 3. Verificar oportunidades
                this.addLog('INFO', '📋 Etapa 3: Verificando oportunidades...');
                await this.verificarOportunidades();

                this.addLog('SUCCESS', `✅ Ciclo #${ciclo} concluído com sucesso!`);

            } catch (error) {
                this.addLog('ERROR', `💥 Erro no ciclo #${ciclo}: ${error.message}`);
                await this.takeScreenshot(`ciclo_${ciclo}_erro`, `Erro no ciclo #${ciclo}: ${error.message}`);
            }

            // Screenshot do fim do ciclo
            await this.takeScreenshot(`ciclo_${ciclo}_fim`, `Fim do ciclo #${ciclo}`);

            // Aguardar próximo ciclo
            this.addLog('INFO', `⏳ Aguardando ${this.config.intervaloVerificacao}s para próximo ciclo...`);
            await this.sleep(this.config.intervaloVerificacao * 1000);
        }
    }

    /**
     * Utility para dormir
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Inicia o robô
     */
    async iniciar() {
        this.isRunning = true;

        this.addLog('INFO', '🤖 Robô BB Tips iniciado');
        this.addLog('INFO', `📧 Email: ${this.config.email}`);
        this.addLog('INFO', `🌐 URL: ${this.config.urlBase}`);
        this.addLog('INFO', `⏱️ Intervalo: ${this.config.intervaloVerificacao}s`);
        this.addLog('INFO', `📁 Screenshots serão salvos em: ${SCREENSHOT_DIR}`);
        this.addLog('INFO', `🎯 Estratégias: ${this.config.estrategiasAtivas.join(', ')}`);

        try {
            // Inicializar browser
            await this.initBrowser();

            // Fazer login inicial
            this.addLog('INFO', '🔐 Fazendo login inicial...');
            const loginSuccess = await this.fazerLogin();
            
            if (!loginSuccess) {
                this.addLog('ERROR', '❌ Falha no login inicial');
                return;
            }

            // Executar loop principal
            await this.executarLoopPrincipal();

        } catch (error) {
            this.addLog('ERROR', `💥 Erro crítico: ${error.message}`);
        } finally {
            // Fechar browser
            await this.closeBrowser();
            this.isRunning = false;
            this.addLog('INFO', '🛑 Robô parado');
        }
    }

    /**
     * Para o robô
     */
    parar() {
        this.addLog('WARNING', '🛑 Solicitação de parada recebida');
        this.isRunning = false;
    }

    /**
     * Retorna os logs
     */
    getLogs(limit = 100) {
        return this.logs.slice(-limit);
    }
}

// Configuração do robô
const config = {
    credencialId: process.env.CREDENCIAL_ID || '1EFF3743-8D41-4CA6-8014-2D0B4CAB3F1A',
    email: process.env.BBTIPS_EMAIL || '@email',
    senha: process.env.BBTIPS_SENHA || '@Leo10203040',
    urlBase: process.env.BBTIPS_URL || 'https://app.bbtips.com.br',
    intervaloVerificacao: parseInt(process.env.INTERVALO) || 30,
    estrategiasAtivas: (process.env.ESTRATEGIAS || 'Estratégia 1,Estratégia 2').split(','),
    modoDebug: process.env.DEBUG === 'true'
};

// Criar instância do robô
const robo = new BBTipsRobo(config);

// Configurar callback para logs (pode enviar para o backend)
robo.setLogCallback(async (log) => {
    try {
        // Enviar log para o backend via API
        if (process.env.SEND_LOGS_TO_API === 'true') {
            await axios.post(`${API_BASE_URL}/api/robo/log`, log);
        }
    } catch (error) {
        console.error('Erro ao enviar log para API:', error.message);
    }
});

// Capturar Ctrl+C para parar o robô gracefulmente
process.on('SIGINT', async () => {
    console.log('\n\n⏹️ Parando robô por Ctrl+C...');
    robo.parar();
    await robo.closeBrowser();
    process.exit(0);
});

// Iniciar robô
console.log('='.repeat(60));
console.log('🧪 Teste do Robô BB Tips com Puppeteer');
console.log('='.repeat(60));

(async () => {
    try {
        await robo.iniciar();
    } catch (error) {
        console.error('💥 Erro fatal:', error);
        process.exit(1);
    }
})();

module.exports = { BBTipsRobo, config };
