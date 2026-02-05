/**
 * BB Tips Robot - Main Service
 */

const fs = require('fs');
const path = require('path');

class BBTipsRobo {
    constructor(config) {
        this.config = config;
        this.browser = null;
        this.page = null;
        this.isRunning = false;
        this.logs = [];
        
        // Criar diretório de logs
        this.logsDir = path.join(__dirname, '..', 'logs');
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
        this.logFile = path.join(this.logsDir, `bbtips_${new Date().toISOString().split('T')[0]}.log`);
    }
    
    addLog(level, message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] ${message}`;
        console.log(logEntry);
        fs.appendFileSync(this.logFile, logEntry + '\n');
        this.logs.push({ timestamp, level, message });
    }
    
    async init() {
        this.addLog('INFO', 'Inicializando browser...');
        const puppeteer = require('puppeteer');
        this.browser = await puppeteer.launch({
            headless: false,
            devtools: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1920, height: 1080 });
        this.addLog('SUCCESS', 'Browser iniciado');
    }
    
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.addLog('INFO', 'Browser fechado');
        }
    }
    
    async fazerLogin() {
        this.addLog('INFO', ' Fazendo login...');
        await this.page.goto(`${this.config.urlBase}/login`);
        await this.page.waitForSelector('body', { timeout: 10000 });
        await this.sleep(2000);
        
        // Preencher email
        const emailInput = await this.page.$('input[type="email"], input[name="email"]');
        if (emailInput) {
            await emailInput.focus();
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('A');
            await this.page.keyboard.up('Control');
            await emailInput.type(this.config.email);
        }
        
        // Preencher senha
        const passwordInput = await this.page.$('input[type="password"]');
        if (passwordInput) {
            await passwordInput.focus();
            await passwordInput.type(this.config.senha);
        }
        
        // Clicar login
        const submitBtn = await this.page.$('button[type="submit"]');
        if (submitBtn) {
            await submitBtn.click();
            await this.sleep(5000);
        }
        
        return !this.page.url().includes('/login');
    }
    
    async executarBuscadorPadroes(config) {
        this.addLog('INFO', 'Executando Buscador de Padrões...');
        
        try {
            // Navegar para página de bots
            await this.page.goto(`${this.config.urlBase}/bots/novo`);
            await this.sleep(2000);
            
            // Clicar no botão do Buscador (XPath)
            const xpath = '/html/body/app-root/div/app-robos-novo/div/div/div[5]/div/div[1]/div[2]/button[3]';
            const buttons = await this.page.$x(xpath);
            if (buttons.length > 0) {
                await buttons[0].click();
                this.addLog('SUCCESS', 'Modal aberto');
                await this.sleep(2000);
            }
            
            // Preencher parâmetros
            await this.preencherParametros(config.parametros);
            
            // Clicar em Buscar
            const buscarBtn = await this.page.$('button:contains("Buscar")');
            if (buscarBtn) {
                await buscarBtn.click();
                this.addLog('INFO', 'Buscando...');
                await this.sleep(3000);
            }
            
            // Clicar na primeira linha da tabela
            const tabelaXpath = '/html/body/app-root/div/app-robos-novo/app-buscador-padroes/div/div/div/div[2]/div[5]/div/table/tbody/tr[1]';
            const linhas = await this.page.$x(tabelaXpath);
            if (linhas.length > 0) {
                await linhas[0].click();
                this.addLog('INFO', 'Linha clicada');
                await this.sleep(1000);
            }
            
            // Aceitar alert
            this.page.on('dialog', async dialog => {
                await dialog.accept();
            });
            await this.sleep(2000);
            
            // Clicar em Opções Avançadas -> Ver Mais
            const avancadasBtn = await this.page.$('button:contains("Opções Avançadas")');
            if (avancadasBtn) {
                await avancadasBtn.click();
                await this.sleep(500);
            }
            const verMaisBtn = await this.page.$('button:contains("Ver Mais")');
            if (verMaisBtn) {
                await verMaisBtn.click();
                this.addLog('INFO', 'Ver Mais clicado');
                await this.sleep(1000);
            }
            
            // Preencher Stake e Multiplicador
            const inputs = await this.page.$$('input');
            if (inputs.length >= 2) {
                await inputs[0].focus();
                await inputs[0].type(config.parametros.stakeInicial.toString());
                await inputs[1].focus();
                await inputs[1].type(config.parametros.multiplicador.toString());
            }
            
            // Clicar em Calcular
            const calcularBtn = await this.page.$('button:contains("Calcular")');
            if (calcularBtn) {
                await calcularBtn.click();
                this.addLog('INFO', 'Calculando...');
                await this.sleep(3000);
            }
            
            return { sucesso: true, message: 'Fluxo concluído' };
            
        } catch (error) {
            this.addLog('ERROR', error.message);
            return { sucesso: false, erro: error.message };
        }
    }
    
    async preencherParametros(params) {
        // Máximo Pulos = 80
        const pulosNgSelect = await this.page.$('ng-select[placeholder*="Pulos"]');
        if (pulosNgSelect) {
            await pulosNgSelect.click();
            await this.sleep(500);
            const opcoes = await this.page.$$('ng-dropdown-panel .ng-option');
            for (const opcao of opcoes) {
                const texto = await opcao.evaluate(el => el.textContent.trim());
                if (texto === '80') {
                    await opcao.click();
                    break;
                }
            }
        }
        
        // % Inicial = 94
        const percentInput = await this.page.$('input[placeholder*="%"]');
        if (percentInput) {
            await percentInput.focus();
            await percentInput.type('94');
        }
        
        // Total Registros = 3
        const registrosNgSelect = await this.page.$('ng-select[placeholder*="Registros"]');
        if (registrosNgSelect) {
            await registrosNgSelect.click();
            await this.sleep(500);
            const opcoes = await this.page.$$('ng-dropdown-panel .ng-option');
            for (const opcao of opcoes) {
                const texto = await opcao.evaluate(el => el.textContent.trim());
                if (texto === '3') {
                    await opcao.click();
                    break;
                }
            }
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = { BBTipsRobo };
