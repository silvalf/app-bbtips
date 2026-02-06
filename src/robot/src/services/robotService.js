/**
 * BB Tips Robot - Main Service
 * Improved logging for better error identification
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
        this.stepCount = 0;
        
        // Criar diretório de logs
        this.logsDir = path.join(__dirname, '..', 'logs');
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
        this.logFile = path.join(this.logsDir, `bbtips_${new Date().toISOString().split('T')[0]}.log`);
        
        // Criar diretório de screenshots
        this.screenshotsDir = path.join(__dirname, '..', 'screenshots');
        if (!fs.existsSync(this.screenshotsDir)) {
            fs.mkdirSync(this.screenshotsDir, { recursive: true });
        }
    }
    
    addLog(level, message, data = null) {
        this.stepCount++;
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level.padEnd(7)}] [PASSO ${this.stepCount}] ${message}${data ? ' | ' + JSON.stringify(data) : ''}`;
        console.log(logEntry);
        fs.appendFileSync(this.logFile, logEntry + '\n');
        this.logs.push({ timestamp, level, message, data, step: this.stepCount });
    }
    
    async takeScreenshot(filename) {
        const screenshotPath = path.join(this.screenshotsDir, `${this.stepCount}_${filename}.png`);
        try {
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            this.addLog('DEBUG', `Screenshot salvo: ${screenshotPath}`);
        } catch (error) {
            this.addLog('WARN', `Falha ao salvar screenshot: ${error.message}`);
        }
    }
    
    async init() {
        this.addLog('INFO', '========================================');
        this.addLog('INFO', 'INICIANDO BB TIPS ROBOT');
        this.addLog('INFO', '========================================');
        this.addLog('INFO', `URL Base: ${this.config.urlBase}`);
        this.addLog('INFO', `Email: ${this.config.email ? '****@***.***' : 'NÃO CONFIGURADO'}`);
        this.addLog('INFO', 'Inicializando browser...');
        
        const puppeteer = require('puppeteer');
        this.browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        // Capturar console do navegador
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                this.addLog('BROWSER-ERROR', `Console Error: ${msg.text()}`);
            }
        });
        
        // Capturar erros de página
        this.page.on('pageerror', error => {
            this.addLog('PAGE-ERROR', `Page Error: ${error.message}`);
        });
        
        this.addLog('SUCCESS', 'Browser iniciado com sucesso');
        await this.takeScreenshot('01_browser_iniciado');
    }
    
    async close() {
        if (this.browser) {
            await this.takeScreenshot('99_fechando');
            await this.browser.close();
            this.addLog('INFO', 'Browser fechado');
            this.addLog('INFO', '========================================');
            this.addLog('INFO', 'ROBÔ FINALIZADO');
            this.addLog('INFO', `Total de passos: ${this.stepCount}`);
            this.addLog('INFO', '========================================');
        }
    }
    
    async fazerLogin() {
        this.addLog('INFO', '---------------------------------------');
        this.addLog('INFO', 'INICIANDO LOGIN');
        this.addLog('INFO', '---------------------------------------');
        
        const loginUrl = `${this.config.urlBase}/login`;
        this.addLog('INFO', `Navegando para: ${loginUrl}`);
        
        await this.page.goto(loginUrl, { waitUntil: 'networkidle0' });
        await this.takeScreenshot('02_pagina_login');
        
        // Aguardar carregamento
        await this.sleep(3000);
        
        // Verificar se a página carregou
        const title = await this.page.title();
        this.addLog('DEBUG', `Título da página: ${title}`);
        
        // Preencher email
        this.addLog('INFO', 'Procurando campo de email...');
        const emailInput = await this.page.$('input[type="email"], input[name="email"], input[id*="email"]');
        
        if (emailInput) {
            this.addLog('SUCCESS', 'Campo de email encontrado');
            await emailInput.focus();
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('A');
            await this.page.keyboard.up('Control');
            
            if (this.config.email) {
                await this.page.keyboard.type(this.config.email);
                this.addLog('INFO', 'Email preenchido');
            } else {
                this.addLog('ERROR', 'Email não configurado no .env');
                return false;
            }
        } else {
            this.addLog('ERROR', 'Campo de email não encontrado!');
            await this.takeScreenshot('erro_campo_email');
            return false;
        }
        
        // Preencher senha
        this.addLog('INFO', 'Procurando campo de senha...');
        const passwordInput = await this.page.$('input[type="password"]');
        
        if (passwordInput) {
            this.addLog('SUCCESS', 'Campo de senha encontrado');
            await passwordInput.focus();
            
            if (this.config.senha) {
                await this.page.keyboard.type(this.config.senha);
                this.addLog('INFO', 'Senha preenchida');
            } else {
                this.addLog('ERROR', 'Senha não configurada no .env');
                return false;
            }
        } else {
            this.addLog('ERROR', 'Campo de senha não encontrado!');
            await this.takeScreenshot('erro_campo_senha');
            return false;
        }
        
        // Clicar login
        this.addLog('INFO', 'Procurando botão de login...');
        
        // Primeiro tenta selector simples
        let submitBtn = await this.page.$('button[type="submit"]');
        
        if (!submitBtn) {
            // Se não encontrar, usa XPath para buscar por texto
            const xpathLogin = "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'entrar') or contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'login') or contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'acessar')]";
            const buttons = await this.page.$x(xpathLogin);
            if (buttons.length > 0) {
                submitBtn = buttons[0];
            }
        }
        
        if (submitBtn) {
            const btnText = await submitBtn.evaluate(el => el.innerText.trim());
            this.addLog('SUCCESS', `Botão de login encontrado: "${btnText}"`);
            await submitBtn.click();
            this.addLog('INFO', 'Clicou no botão de login, aguardando...');
            await this.sleep(5000);
            
            await this.takeScreenshot('03_apos_login');
        } else {
            this.addLog('ERROR', 'Botão de login não encontrado!');
            await this.takeScreenshot('erro_botao_login');
            return false;
        }
        
        // Verificar se login foi sucesso
        const currentUrl = this.page.url();
        this.addLog('INFO', `URL atual: ${currentUrl}`);
        
        if (currentUrl.includes('/login') || currentUrl.includes('/entrar')) {
            this.addLog('ERROR', 'Login falhou - ainda na página de login');
            await this.takeScreenshot('erro_login');
            return false;
        }
        
        this.addLog('SUCCESS', 'Login realizado com sucesso!');
        this.addLog('INFO', `URL após login: ${currentUrl}`);
        return true;
    }
    
    async executarBuscadorPadroes(config) {
        this.addLog('INFO', '---------------------------------------');
        this.addLog('INFO', 'EXECUTANDO BUSCADOR DE PADRÕES');
        this.addLog('INFO', '---------------------------------------');
        this.addLog('INFO', `Parâmetros: ${JSON.stringify(config.parametros)}`);
        
        try {
            // Navegar para página de bots
            const botsUrl = `${this.config.urlBase}/bots/novo`;
            this.addLog('INFO', `Navegando para: ${botsUrl}`);
            await this.page.goto(botsUrl, { waitUntil: 'networkidle0' });
            await this.sleep(3000);
            await this.takeScreenshot('04_pagina_bots');
            
            // Verificar elementos da página
            const bodyContent = await this.page.$eval('body', el => el.innerText.substring(0, 200));
            this.addLog('DEBUG', `Conteúdo da página: ${bodyContent}...`);
            
            // Clicar no botão do Buscador (XPath)
            this.addLog('INFO', 'Procurando botão do Buscador...');
            const xpath = '/html/body/app-root/div/app-robos-novo/div/div/div[5]/div/div[1]/div[2]/button[3]';
            const buttons = await this.page.$x(xpath);
            
            if (buttons.length > 0) {
                this.addLog('SUCCESS', 'Botão do Buscador encontrado');
                await buttons[0].click();
                await this.sleep(2000);
                await this.takeScreenshot('05_modal_buscador');
            } else {
                this.addLog('WARN', 'Botão do Buscador não encontrado pelo XPath, tentando alternativas...');
                
                // Tentar encontrar por texto usando XPath
                const textButtons = await this.page.$('button');
                for (const btn of textButtons) {
                    const text = (await btn.evaluate(el => el.innerText.toLowerCase())).trim();
                    if (text.includes('buscador') || text.includes('padrão')) {
                        this.addLog('SUCCESS', `Encontrado botão: "${text}"`);
                        await btn.click();
                        await this.sleep(2000);
                        await this.takeScreenshot('05_modal_buscador_alternativo');
                        break;
                    }
                }
            }
            
            // Preencher parâmetros
            this.addLog('INFO', 'Preenchendo parâmetros...');
            await this.preencherParametros(config.parametros);
            
            // Clicar em Buscar
            this.addLog('INFO', 'Procurando botão Buscar...');
            
            // XPath para botão Buscar
            const buscarXpath = "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'buscar')]";
            const buscarBtn = (await this.page.$x(buscarXpath))[0];
            
            if (buscarBtn) {
                const btnText = await buscarBtn.evaluate(el => el.innerText.trim());
                this.addLog('SUCCESS', `Botão Buscar encontrado: "${btnText}"`);
                await buscarBtn.click();
                this.addLog('INFO', 'Clicou em Buscar, aguardando resultados...');
                await this.sleep(5000);
                await this.takeScreenshot('06_resultados_busca');
            } else {
                this.addLog('WARN', 'Botão Buscar não encontrado');
            }
            
            // Aceitar alert - clicar em "Sim" (DEVE ser configurado ANTES da ação)
            this.page.on('dialog', async dialog => {
                this.addLog('INFO', `Dialog detectado: "${dialog.message()}" | Tipo: ${dialog.type()}`);
                await dialog.accept('Sim');
            });
            
            // Clicar na primeira linha da tabela
            this.addLog('INFO', 'Procurando tabela de resultados...');
            const tabelaXpath = '/html/body/app-root/div/app-robos-novo/app-buscador-padroes/div/div/div/div[2]/div[5]/div/table/tbody/tr[1]';
            const linhas = await this.page.$x(tabelaXpath);
            
            if (linhas.length > 0) {
                this.addLog('SUCCESS', 'Primeira linha da tabela encontrada');
                await linhas[0].click();
                this.addLog('INFO', 'Clicou na linha, aguardando alerta...');
                await this.sleep(2000);
                
                // Tentar clicar no botão Sim do SweetAlert2
                const simButton = await this.page.$('button.swal2-confirm.swal2-styled');
                if (simButton) {
                    const btnText = await simButton.evaluate(el => el.innerText.trim());
                    this.addLog('SUCCESS', `Botão "${btnText}" encontrado, clicando...`);
                    await simButton.click();
                } else {
                    this.addLog('WARN', 'Botão Sim não encontrado via selector');
                }
                
                await this.takeScreenshot('07_linha_selecionada');
            } else {
                this.addLog('WARN', 'Tabela de resultados não encontrada');
            }
            
            // Aguardar após aceitar o alerta
            await this.sleep(1000);
            
            // Clicar em Opções Avançadas
            this.addLog('INFO', 'Procurando Opções Avançadas...');
            
            const avancadasXpath = "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'opções avançadas')]";
            const avancadasBtn = (await this.page.$x(avancadasXpath))[0];
            
            if (avancadasBtn) {
                const btnText = await avancadasBtn.evaluate(el => el.innerText.trim());
                this.addLog('SUCCESS', `Opções Avançadas encontrado: "${btnText}"`);
                await avancadasBtn.click();
                await this.sleep(500);
            } else {
                this.addLog('WARN', 'Opções Avançadas não encontrado');
            }
            
            const verMaisXpath = "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'ver mais')]";
            const verMaisBtn = (await this.page.$x(verMaisXpath))[0];
            
            if (verMaisBtn) {
                const btnText = await verMaisBtn.evaluate(el => el.innerText.trim());
                this.addLog('SUCCESS', `Ver Mais encontrado: "${btnText}"`);
                await verMaisBtn.click();
                await this.sleep(1000);
                await this.takeScreenshot('08_opcoes_avancadas');
            }
            
            // Preencher Stake e Multiplicador
            this.addLog('INFO', 'Preenchendo Stake e Multiplicador...');
            const inputs = await this.page.$$('input');
            this.addLog('INFO', `Encontrados ${inputs.length} inputs na página`);
            
            if (inputs.length >= 2) {
                await inputs[0].focus();
                await this.page.keyboard.down('Control');
                await this.page.keyboard.press('A');
                await this.page.keyboard.up('Control');
                await this.page.keyboard.type(config.parametros.stakeInicial.toString());
                this.addLog('INFO', `Stake preenchido: ${config.parametros.stakeInicial}`);
                
                await inputs[1].focus();
                await this.page.keyboard.down('Control');
                await this.page.keyboard.press('A');
                await this.page.keyboard.up('Control');
                await this.page.keyboard.type(config.parametros.multiplicador.toString());
                this.addLog('INFO', `Multiplicador preenchido: ${config.parametros.multiplicador}`);
                
                await this.takeScreenshot('09_stake_multiplicador');
            } else {
                this.addLog('WARN', 'Inputs de Stake/Multiplicador não encontrados');
            }
            
            // Clicar em Calcular
            const calcularXpath = "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'calcular')]";
            const calcularBtn = (await this.page.$x(calcularXpath))[0];
            
            if (calcularBtn) {
                const btnText = await calcularBtn.evaluate(el => el.innerText.trim());
                this.addLog('SUCCESS', `Calcular encontrado: "${btnText}"`);
                await calcularBtn.click();
                this.addLog('INFO', 'Calculando...');
                await this.sleep(3000);
                await this.takeScreenshot('10_calculo_final');
            }
            
            this.addLog('SUCCESS', '========================================');
            this.addLog('SUCCESS', 'BUSCADOR DE PADRÕES CONCLUÍDO COM SUCESSO!');
            this.addLog('SUCCESS', '========================================');
            return { sucesso: true, message: 'Fluxo concluído', steps: this.stepCount };
            
        } catch (error) {
            this.addLog('ERROR', '========================================');
            this.addLog('ERROR', `ERRO NO BUSCADOR: ${error.message}`);
            this.addLog('ERROR', '========================================');
            await this.takeScreenshot('erro_buscador');
            
            // Log do stack trace
            this.addLog('ERROR-STACK', error.stack);
            
            return { sucesso: false, erro: error.message, step: this.stepCount };
        }
    }
    
    async preencherParametros(params) {
        this.addLog('INFO', '---------------------------------------');
        this.addLog('INFO', 'PREECHENDO PARÂMETROS');
        this.addLog('INFO', '---------------------------------------');
        
        try {
            // Máximo Pulos = 80
            this.addLog('INFO', 'Configurando Máximo Pulos...');
            const pulosNgSelect = await this.page.$('ng-select[placeholder*="Pulos"]');
            if (pulosNgSelect) {
                await pulosNgSelect.click();
                await this.sleep(500);
                const opcoes = await this.page.$$('ng-dropdown-panel .ng-option');
                let pulosSetado = false;
                for (const opcao of opcoes) {
                    const texto = await opcao.evaluate(el => el.textContent.trim());
                    if (texto === params.maximoPulos.toString()) {
                        await opcao.click();
                        this.addLog('SUCCESS', `Máximo Pulos configurado: ${texto}`);
                        pulosSetado = true;
                        break;
                    }
                }
                if (!pulosSetado) {
                    this.addLog('WARN', `Opção ${params.maximoPulos} não encontrada, usando primeira opção`);
                }
            } else {
                this.addLog('WARN', 'Campo Máximo Pulos não encontrado');
            }
            
            // % Inicial
            this.addLog('INFO', 'Configurando Percentual Inicial...');
            const percentInput = await this.page.$('input[placeholder*="%"]');
            if (percentInput) {
                await percentInput.focus();
                await this.page.keyboard.down('Control');
                await this.page.keyboard.press('A');
                await this.page.keyboard.up('Control');
                await this.page.keyboard.type(params.percentualInicial.toString());
                this.addLog('SUCCESS', `Percentual Inicial: ${params.percentualInicial}`);
            } else {
                this.addLog('WARN', 'Campo Percentual não encontrado');
            }
            
            // Total Registros
            this.addLog('INFO', 'Configurando Total Registros...');
            const registrosNgSelect = await this.page.$('ng-select[placeholder*="Registros"]');
            if (registrosNgSelect) {
                await registrosNgSelect.click();
                await this.sleep(500);
                const opcoes = await this.page.$$('ng-dropdown-panel .ng-option');
                let registrosSetado = false;
                for (const opcao of opcoes) {
                    const texto = await opcao.evaluate(el => el.textContent.trim());
                    if (texto === params.totalRegistros.toString()) {
                        await opcao.click();
                        this.addLog('SUCCESS', `Total Registros: ${texto}`);
                        registrosSetado = true;
                        break;
                    }
                }
                if (!registrosSetado) {
                    this.addLog('WARN', `Opção ${params.totalRegistros} não encontrada`);
                }
            } else {
                this.addLog('WARN', 'Campo Registros não encontrado');
            }
            
            await this.takeScreenshot('parametros_preenchidos');
            this.addLog('INFO', 'Parâmetros preenchidos com sucesso');
            
        } catch (error) {
            this.addLog('ERROR', `Erro ao preencher parâmetros: ${error.message}`);
            throw error;
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = { BBTipsRobo };
