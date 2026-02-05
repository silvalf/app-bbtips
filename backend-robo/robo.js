/**
 * Robô de Automação BB Tips com Puppeteer
 * Faz scraping/login no sistema BB Tips e executa estratégias
 */

require('dotenv').config();
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuração
const SCREENSHOT_DIR = process.platform === 'win32' 
    ? 'c:\\temp\\bbtips_screenshots' 
    : '/tmp/bbtips_screenshots';
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

/**
 * Formata data para nome de arquivo
 */
function formatDate(date) {
    const pad = (n) => String(n).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

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
        const icon = colors[level] || '📋';
        console.log(`[${logEntry.timestamp}] ${icon} [${level}] ${message}`);
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
        const timestamp = formatDate(new Date());
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
                headless: true, // Modo headless conforme solicitado
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
            
            // Configurar User Agent para parecer um navegador real
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

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

        try {
            // Navegar para a página de login
            this.addLog('INFO', '📡 Navegando para página de login...');
            await this.page.goto(`${this.config.urlBase}/login`, {
                waitUntil: 'networkidle2',
                timeout: 60000
            });

            // Aguardar carregamento da página
            await this.page.waitForSelector('body', { timeout: 10000 });
            await this.sleep(3000); // Aguardar renderização completa

            // Screenshot da página carregada
            await this.takeScreenshot('login_pagina_carregada', 'Página de login carregada');

            // Encontrar e preencher o campo de email
            this.addLog('INFO', '📝 Procurando campo de email...');
            
            // Seletores para o campo de email (do mais específico ao mais genérico)
            const emailSelectors = [
                'input[type="email"]',
                'input[name="email"]',
                'input[id="email"]',
                'input[placeholder*="mail"]',
                'input[placeholder*="Mail"]',
                'input[placeholder*="E-mail"]',
                'input[autocomplete="email"]',
                'input[autocomplete="username"]',
                'form input[type="text"]:first-of-type'
            ];
            
            let emailSelector = null;
            for (const selector of emailSelectors) {
                try {
                    const element = await this.page.$(selector);
                    if (element) {
                        emailSelector = selector;
                        this.addLog('SUCCESS', `✅ Campo de email encontrado com seletor: ${selector}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (emailSelector) {
                // Limpar e preencher email
                await this.page.click(emailSelector, { clickCount: 3 });
                await this.page.keyboard.press('Backspace');
                await this.page.type(emailSelector, this.config.email, { delay: 50 });
                this.addLog('SUCCESS', '✅ Email preenchido');
            } else {
                // Tentar encontrar qualquer input visível
                this.addLog('WARNING', '⚠️ Seletores padrão não encontraram campo de email, tentando inputs genéricos...');
                const inputs = await this.page.$$('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
                if (inputs.length > 0) {
                    await inputs[0].click({ clickCount: 3 });
                    await this.page.keyboard.press('Backspace');
                    await inputs[0].type(this.config.email, { delay: 50 });
                    this.addLog('SUCCESS', '✅ Email preenchido no primeiro input encontrado');
                } else {
                    throw new Error('Campo de email não encontrado');
                }
            }

            await this.sleep(500);

            // Encontrar e preencher o campo de senha
            this.addLog('INFO', '🔑 Procurando campo de senha...');
            
            const passwordSelectors = [
                'input[type="password"]',
                'input[name="password"]',
                'input[id="password"]',
                'input[name="senha"]',
                'input[placeholder*="senha"]',
                'input[placeholder*="Senha"]',
                'input[placeholder*="password"]',
                'input[autocomplete="current-password"]'
            ];
            
            let passwordSelector = null;
            for (const selector of passwordSelectors) {
                try {
                    const element = await this.page.$(selector);
                    if (element) {
                        passwordSelector = selector;
                        this.addLog('SUCCESS', `✅ Campo de senha encontrado com seletor: ${selector}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (passwordSelector) {
                await this.page.click(passwordSelector, { clickCount: 3 });
                await this.page.keyboard.press('Backspace');
                await this.page.type(passwordSelector, this.config.senha, { delay: 50 });
                this.addLog('SUCCESS', '✅ Senha preenchida');
            } else {
                throw new Error('Campo de senha não encontrado');
            }

            // Screenshot após preencher credenciais
            await this.takeScreenshot('login_preenchido', 'Credenciais preenchidas');

            await this.sleep(500);

            // Encontrar e clicar no botão de login
            this.addLog('INFO', '🔘 Procurando botão de login...');
            
            const buttonSelectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button.btn-primary',
                'button.login-btn',
                'button[class*="login"]',
                'button[class*="submit"]',
                'button[class*="btn-primary"]',
                '.login-form button',
                'form button'
            ];
            
            let buttonFound = false;
            for (const selector of buttonSelectors) {
                try {
                    const button = await this.page.$(selector);
                    if (button) {
                        this.addLog('SUCCESS', `✅ Botão de login encontrado com seletor: ${selector}`);
                        
                        // Clicar e aguardar navegação
                        this.addLog('INFO', '🔘 Clicando no botão de login...');
                        
                        await Promise.all([
                            this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
                            button.click()
                        ]);
                        
                        buttonFound = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            // Se não encontrou com seletores, tentar por texto
            if (!buttonFound) {
                this.addLog('INFO', '🔍 Tentando encontrar botão por texto...');
                const buttons = await this.page.$$('button');
                for (const btn of buttons) {
                    const text = await this.page.evaluate(el => el.textContent, btn);
                    if (text && (text.toLowerCase().includes('entrar') || 
                                 text.toLowerCase().includes('login') || 
                                 text.toLowerCase().includes('acessar'))) {
                        this.addLog('SUCCESS', `✅ Botão encontrado por texto: "${text.trim()}"`);
                        await Promise.all([
                            this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
                            btn.click()
                        ]);
                        buttonFound = true;
                        break;
                    }
                }
            }
            
            if (!buttonFound) {
                // Último recurso: pressionar Enter
                this.addLog('WARNING', '⚠️ Botão não encontrado, tentando pressionar Enter...');
                await this.page.keyboard.press('Enter');
                await this.sleep(5000);
            }

            // Aguardar carregamento após login
            await this.sleep(5000);

            // Screenshot após login
            await this.takeScreenshot('login_resultado', 'Resultado do login');

            // Verificar se login foi bem-sucedido
            const currentUrl = this.page.url();
            const pageContent = await this.page.content();
            
            this.addLog('INFO', `📍 URL atual após login: ${currentUrl}`);
            
            // Verificar indicadores de sucesso
            const successIndicators = [
                !currentUrl.includes('/login'),
                pageContent.toLowerCase().includes('dashboard'),
                pageContent.toLowerCase().includes('bem-vindo'),
                pageContent.toLowerCase().includes('logout'),
                pageContent.toLowerCase().includes('sair'),
                pageContent.toLowerCase().includes('minha conta')
            ];
            
            if (successIndicators.some(indicator => indicator === true)) {
                this.addLog('SUCCESS', '✅ Login realizado com sucesso!');
                return true;
            } else {
                // Verificar se há mensagem de erro
                const errorMessages = await this.page.$$eval('*', elements => {
                    return elements
                        .filter(el => {
                            const text = el.textContent?.toLowerCase() || '';
                            return text.includes('erro') || 
                                   text.includes('inválid') || 
                                   text.includes('incorret') ||
                                   text.includes('falha');
                        })
                        .map(el => el.textContent?.trim())
                        .filter(t => t && t.length < 200)
                        .slice(0, 3);
                }).catch(() => []);
                
                if (errorMessages.length > 0) {
                    this.addLog('ERROR', `❌ Possível erro de login: ${errorMessages[0]}`);
                }
                
                this.addLog('WARNING', '⚠️ Login pode ter falhado - verificando...');
                await this.takeScreenshot('login_verificacao', 'Verificação de login');
                
                // Dar mais uma chance - às vezes a página ainda está carregando
                await this.sleep(3000);
                const newUrl = this.page.url();
                if (!newUrl.includes('/login')) {
                    this.addLog('SUCCESS', '✅ Login confirmado após verificação adicional!');
                    return true;
                }
                
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
            return;
        }

        this.addLog('SUCCESS', `✅ Encontradas ${estrategias.length} estratégias configuradas`);
        estrategias.forEach((estrategia, index) => {
            this.addLog('DEBUG', `  ${index + 1}. ${estrategia.trim()}`);
        });
    }

    /**
     * Verifica oportunidades de apostas
     */
    async verificarOportunidades() {
        this.addLog('INFO', '🔍 Verificando oportunidades de apostas...');

        // TODO: Implementar scraping de oportunidades específicas do BB Tips
        this.addLog('INFO', '📭 Verificação de oportunidades - aguardando implementação específica');
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

            try {
                // Verificar se ainda está logado
                const currentUrl = this.page.url();
                
                if (currentUrl.includes('/login')) {
                    this.addLog('WARNING', '⚠️ Sessão expirada, fazendo login novamente...');
                    const loginSuccess = await this.fazerLogin();
                    if (!loginSuccess) {
                        this.addLog('WARNING', '⚠️ Falha no re-login, aguardando próximo ciclo');
                        await this.sleep(this.config.intervaloVerificacao * 1000);
                        continue;
                    }
                } else {
                    this.addLog('SUCCESS', '✅ Sessão ativa');
                }

                // Screenshot do ciclo
                await this.takeScreenshot(`ciclo_${ciclo}`, `Ciclo #${ciclo}`);

                // Verificar estratégias
                await this.verificarEstrategias();

                // Verificar oportunidades
                await this.verificarOportunidades();

                this.addLog('SUCCESS', `✅ Ciclo #${ciclo} concluído!`);

            } catch (error) {
                this.addLog('ERROR', `💥 Erro no ciclo #${ciclo}: ${error.message}`);
                await this.takeScreenshot(`ciclo_${ciclo}_erro`, `Erro no ciclo`);
            }

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

        console.log('\n');
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║         🤖 ROBÔ BB TIPS - AUTOMAÇÃO COM PUPPETEER          ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        console.log('\n');

        this.addLog('INFO', '🤖 Robô BB Tips iniciado');
        this.addLog('INFO', `📧 Email: ${this.config.email}`);
        this.addLog('INFO', `🌐 URL: ${this.config.urlBase}`);
        this.addLog('INFO', `⏱️ Intervalo: ${this.config.intervaloVerificacao}s`);
        this.addLog('INFO', `📁 Screenshots: ${SCREENSHOT_DIR}`);

        try {
            // Inicializar browser
            await this.initBrowser();

            // Fazer login inicial
            this.addLog('INFO', '🔐 Fazendo login inicial...');
            const loginSuccess = await this.fazerLogin();
            
            if (!loginSuccess) {
                this.addLog('ERROR', '❌ Falha no login inicial. Verifique as credenciais.');
                this.addLog('INFO', '💡 Dica: Confira o screenshot em ' + SCREENSHOT_DIR);
                await this.closeBrowser();
                return;
            }

            this.addLog('SUCCESS', '🎉 Login bem-sucedido! Iniciando monitoramento...');

            // Executar loop principal
            await this.executarLoopPrincipal();

        } catch (error) {
            this.addLog('ERROR', `💥 Erro crítico: ${error.message}`);
        } finally {
            await this.closeBrowser();
            this.isRunning = false;
            this.addLog('INFO', '🛑 Robô finalizado');
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

// Configuração do robô a partir das variáveis de ambiente
const config = {
    email: process.env.BBTIPS_EMAIL || 'luizsilva.perfil@gmail.com',
    senha: process.env.BBTIPS_SENHA || '@Leo102030',
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
        if (process.env.SEND_LOGS_TO_API === 'true') {
            await axios.post(`${API_BASE_URL}/api/robo/log`, log).catch(() => {});
        }
    } catch (error) {
        // Silenciar erros de envio de log
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
(async () => {
    try {
        await robo.iniciar();
    } catch (error) {
        console.error('💥 Erro fatal:', error);
        process.exit(1);
    }
})();

module.exports = { BBTipsRobo, config };
