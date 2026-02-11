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
        this.dadosCards = [];
        
        // URL da API para inserir dados no banco (localhost)
        this.apiUrl = process.env.API_URL || 'http://localhost:5000';
        
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
        // const screenshotPath = path.join(this.screenshotsDir, `${this.stepCount}_${filename}.png`);
        // try {
        //     await this.page.screenshot({ path: screenshotPath, fullPage: true });
        //     this.addLog('DEBUG', `Screenshot salvo: ${screenshotPath}`);
        // } catch (error) {
        //     this.addLog('WARN', `Falha ao salvar screenshot: ${error.message}`);
        // }
    }
    
    async init() {
        this.addLog('INFO', '========================================');
        this.addLog('INFO', 'INICIANDO BB TIPS ROBOT');
        this.addLog('INFO', '========================================');
        this.addLog('INFO', `URL Base (BB Tips): ${this.config.urlBase}`);
        this.addLog('INFO', `API URL (Banco): ${this.apiUrl}`);
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
    
    async executarBuscadorTodasTabelas(config) {
        this.addLog('INFO', '---------------------------------------');
        this.addLog('INFO', 'EXECUTANDO BUSCADOR DE PADRÕES - TODAS AS TABELAS');
        this.addLog('INFO', '---------------------------------------');
        this.addLog('INFO', `URL Base do robô: ${this.config.urlBase}`);
        
        const todosOsCards = [];
        let totalTabelasProcessadas = 0;
        
        const botsUrl = `${this.config.urlBase}/bots/novo`;
        
        try {
            // ═══════════════════════════════════════════════════════════
            // PASSO 1: Navegar para página de bots
            // ═══════════════════════════════════════════════════════════
            this.addLog('INFO', `Navegando para: ${botsUrl}`);
            await this.page.goto(botsUrl, { waitUntil: 'networkidle0', timeout: 60000 });
            await this.sleep(3000);
            await this.takeScreenshot('01_pagina_bots');
            
            // ═══════════════════════════════════════════════════════════
            // PASSO 2: Clicar em "Buscar Padrões"
            // ═══════════════════════════════════════════════════════════
            this.addLog('INFO', 'Procurando botão Buscar Padrões...');
            const buscarPadroesSelector = 'body > app-root > div > app-robos-novo > div > div > div:nth-child(5) > div > div.col-md-6.px-3 > div.col-md-12.pt-1 > button.btn.btn-success.ms-2';
            const buscarPadroesBtn = await this.page.$(buscarPadroesSelector);
            
            if (buscarPadroesBtn) {
                const btnText = await buscarPadroesBtn.evaluate(el => el.innerText.trim());
                this.addLog('SUCCESS', `Botão Buscar Padrões encontrado: "${btnText}"`);
                await buscarPadroesBtn.click();
                await this.sleep(2000);
                await this.takeScreenshot('02_modal_buscador_aberto');
            } else {
                this.addLog('ERROR', 'Botão Buscar Padrões não encontrado!');
                return { sucesso: false, erro: 'Botão Buscar Padrões não encontrado' };
            }
            
            // ═══════════════════════════════════════════════════════════
            // PASSO 3: Configurar parâmetros (Máximo Pulos = 80)
            // ═══════════════════════════════════════════════════════════
            this.addLog('INFO', 'Configurando Máximo Pulos...');
            const pulosNgSelect = await this.page.$('ng-select[placeholder*="Pulos"]');
            if (pulosNgSelect) {
                await pulosNgSelect.click();
                await this.sleep(500);
                const opcoes = await this.page.$('ng-dropdown-panel .ng-option');
                let pulosSetado = false;
                for (const opcao of opcoes) {
                    const texto = await opcao.evaluate(el => el.textContent.trim());
                    if (texto === '80') {
                        await opcao.click();
                        this.addLog('SUCCESS', 'Máximo Pulos configurado: 80');
                        pulosSetado = true;
                        break;
                    }
                }
                if (!pulosSetado && opcoes.length > 0) {
                    await opcoes[0].click();
                    this.addLog('WARN', 'Opção 80 não encontrada, usando primeira opção');
                }
            }
            
            // ═══════════════════════════════════════════════════════════
            // PASSO 4: Clicar em Buscar
            // ═══════════════════════════════════════════════════════════
            this.addLog('INFO', 'Procurando botão Buscar no modal...');
            const buscarModalBtn = await this.page.$('#myModal-buscador > div > div > div > div > div > div > div > div.col-md-12.pt-3 > button');
            
            if (buscarModalBtn) {
                const btnText = await buscarModalBtn.evaluate(el => el.innerText.trim());
                this.addLog('SUCCESS', `Botão Buscar encontrado: "${btnText}"`);
                await buscarModalBtn.click();
                this.addLog('INFO', 'Clicou em Buscar, aguardando resultados...');
                await this.sleep(5000);
            } else {
                const buscarBtnAlt = await this.page.$x("//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'buscar')]");
                if (buscarBtnAlt.length > 0) {
                    await buscarBtnAlt[0].click();
                    this.addLog('SUCCESS', 'Clicou em Buscar (via XPath)');
                    await this.sleep(5000);
                } else {
                    this.addLog('ERROR', 'Botão Buscar não encontrado!');
                    return { sucesso: false, erro: 'Botão Buscar não encontrado' };
                }
            }
            
            // ═══════════════════════════════════════════════════════════
            // PASSO 5: Processar as 5 DIVs de ligas
            // ═══════════════════════════════════════════════════════════
            this.addLog('INFO', '══════════════════════════════════════════════════════════');
            this.addLog('INFO', 'PROCESSANDO AS 5 LIGAS (COPA, EURO, SUPER, PREMIER, TODOS)');
            this.addLog('INFO', '══════════════════════════════════════════════════════════');
            
            // XPath base para as 5 divs de ligas
            const xpathLigasContainer = '/html/body/app-root/div/app-robos-novo/app-buscador-padroes/div/div/div/div[2]';
            const ligas = ['COPA', 'EURO', 'SUPER', 'PREMIER', 'TODOS'];
            
            // ═══════════════════════════════════════════════════════════
            // PASSO 6: Processar cada liga (div)
            // ═══════════════════════════════════════════════════════════
            for (let i = 0; i < ligas.length; i++) {
                const nomeLiga = ligas[i];
                this.addLog('INFO', '');
                this.addLog('INFO', `══════════════════════════════════════════════════════════`);
                this.addLog('INFO', `PROCESSANDO: LIGA ${nomeLiga} (div ${i + 1})`);
                this.addLog('INFO', `══════════════════════════════════════════════════════════`);
                
                try {
                    // ═══════════════════════════════════════════════════════
                    // 6.1: XPath para a div da liga (todas as divs dentro do container)
                    // ═══════════════════════════════════════════════════════
                    const divLigaXPath = `${xpathLigasContainer}/div[${i + 1}]`;
                    const divLigaElements = await this.page.$x(divLigaXPath);
                    
                    if (divLigaElements.length === 0) {
                        this.addLog('WARN', `Div da Liga ${nomeLiga} não encontrada!`);
                        continue;
                    }
                    
                    // ═══════════════════════════════════════════════════════
                    // 6.2: Clicar na primeira linha (tr) dentro da div da liga
                    // ═══════════════════════════════════════════════════════
                    const linhaLigaXPath = `${divLigaXPath}//table/tbody/tr[1]`;
                    this.addLog('INFO', `XPath da linha: ${linhaLigaXPath}`);
                    
                    const linha = await this.page.$x(linhaLigaXPath);
                    
                    if (linha.length > 0) {
                        this.addLog('INFO', `Clicando na primeira linha da Liga ${nomeLiga}...`);
                        await linha[0].click();
                        await this.sleep(1500);
                        
                        // ═══════════════════════════════════════════════════════
                        // 6.3: Clicar no botão Sim do dialog
                        // ═══════════════════════════════════════════════════════
                        this.addLog('INFO', 'Procurando dialog de confirmação...');
                        await this.sleep(1500);
                        
                        const modal = await this.page.$('.swal2-modal');
                        if (modal) {
                            const simButton = await modal.$('.swal2-confirm');
                            if (simButton) {
                                await simButton.click();
                                this.addLog('SUCCESS', 'Clicou em Sim');
                                await this.sleep(1500);
                            }
                        }
                        
                        // ═══════════════════════════════════════════════════════
                        // 6.4: Clicar no elemento div[2]
                        // ═══════════════════════════════════════════════════════
                        const div2Xpath = "/html/body/app-root/div/app-robos-novo/div/div/div[5]/div[1]/div[1]/div[3]/div[2]";
                        const div2Elements = await this.page.$x(div2Xpath);
                        
                        if (div2Elements.length > 0) {
                            await div2Elements[0].click();
                            this.addLog('SUCCESS', 'Clicou no elemento div[2]');
                            await this.sleep(1000);
                        }
                        
                        // ═══════════════════════════════════════════════════════
                        // 6.5: Clicar no span "VER MAIS"
                        // ═══════════════════════════════════════════════════════
                        const spanXpath = "/html/body/app-root/div/app-robos-novo/div/div/div[5]/div[1]/div[1]/div[3]/div[3]/div[2]/div[2]/div[2]/span";
                        const spanElements = await this.page.$x(spanXpath);
                        
                        if (spanElements.length > 0) {
                            await spanElements[0].click();
                            this.addLog('SUCCESS', 'Clicou no span VER MAIS');
                            await this.sleep(1000);
                        }
                        
                        // ═══════════════════════════════════════════════════════
                        // 6.6: Extrair título da liga
                        // ═══════════════════════════════════════════════════════
                        this.addLog('INFO', 'Procurando título da liga...');
                        let tituloLiga = `LIGA - ${nomeLiga}`;
                        
                        // Buscar título da liga - tentando múltiplos seletores
                        const titulosLiga = await this.page.$x('//*[contains(@class, "text-light") and contains(@class, "container-padroes")]');
                        
                        if (titulosLiga.length > 0) {
                            const ultimoTitulo = await titulosLiga[titulosLiga.length - 1].evaluate(el => el.innerText.trim());
                            // Usar o título extraído se for válido (não vazio e não é o fallback)
                            if (ultimoTitulo && ultimoTitulo.length > 0) {
                                tituloLiga = ultimoTitulo;
                                this.addLog('SUCCESS', `Título extraído da página: "${tituloLiga}"`);
                            } else {
                                this.addLog('WARN', `Título extraído vazio, usando fallback: "LIGA - ${nomeLiga}"`);
                            }
                        } else {
                            this.addLog('WARN', `Elemento de título não encontrado, usando fallback: "LIGA - ${nomeLiga}"`);
                        }
                        this.addLog('INFO', `Título final da liga: "${tituloLiga}"`);
                        
                        // ═══════════════════════════════════════════════════════
                        // 6.7: Extrair dados dos cards
                        // ═══════════════════════════════════════════════════════
                        this.addLog('INFO', `══════════════════════════════════════════════════════════`);
                        this.addLog('INFO', `EXTRAINDO CARDS DA LIGA ${nomeLiga}`);                        
                        this.addLog('INFO', `══════════════════════════════════════════════════════════`);
                        
                        const dadosCardsLiga = await this.extrairDadosCards(nomeLiga);
                        
                        if (dadosCardsLiga && dadosCardsLiga.length > 0) {
                            todosOsCards.push(...dadosCardsLiga);
                            this.addLog('SUCCESS', `Liga ${nomeLiga}: ${dadosCardsLiga.length} cards extraídos`);
                        } else {
                            this.addLog('WARN', `Liga ${nomeLiga}: Nenhum card encontrado`);
                        }
                        
                        // ═══════════════════════════════════════════════════════
                        // 6.8: Salvar cards no banco
                        // ═══════════════════════════════════════════════════════
                        if (dadosCardsLiga && dadosCardsLiga.length > 0) {
                            this.addLog('INFO', `Salvando ${dadosCardsLiga.length} cards no banco...`);
                            const insertResult = await this.salvarCardsNoBanco(dadosCardsLiga);
                            
                            if (insertResult && insertResult.success) {
                                this.addLog('SUCCESS', `✓ ${insertResult.saved || dadosCardsLiga.length} cards salvos!`);
                            } else {
                                this.addLog('ERROR', `Erro ao salvar cards: ${insertResult ? insertResult.error : 'Resposta inválida'}`);
                            }
                        }
                        
                        totalTabelasProcessadas++;
                        
                        // ═══════════════════════════════════════════════════════
                        // 6.9: Voltar para página inicial para próxima liga
                        // ═══════════════════════════════════════════════════════
                        if (i < ligas.length - 1) {
                            this.addLog('INFO', `Voltando para página inicial para próxima liga...`);
                            await this.page.goto(botsUrl, { waitUntil: 'networkidle0', timeout: 60000 });
                            await this.sleep(3000);
                            
                            // ═══════════════════════════════════════════════════════
                            // 6.10: Reabrir modal do buscador
                            // ═══════════════════════════════════════════════════════
                            const buscarBtn = await this.page.$(buscarPadroesSelector);
                            if (buscarBtn) {
                                await buscarBtn.click();
                                this.addLog('SUCCESS', 'Modal do buscador reaberto');
                                await this.sleep(2000);
                            }
                            
                            // ═══════════════════════════════════════════════════════
                            // 6.11: Clicar em Buscar novamente
                            // ═══════════════════════════════════════════════════════
                            const buscarModalBtn = await this.page.$('#myModal-buscador > div > div > div > div > div > div > div > div.col-md-12.pt-3 > button');
                            if (buscarModalBtn) {
                                await buscarModalBtn.click();
                                this.addLog('SUCCESS', 'Clicou em Buscar');
                                await this.sleep(5000);
                            }
                        }
                        
                    } else {
                        this.addLog('WARN', `Liga ${nomeLiga}: Nenhuma linha encontrada`);
                    }
                    
                } catch (error) {
                    this.addLog('ERROR', `Erro ao processar Liga ${nomeLiga}: ${error.message}`);
                    this.addLog('ERROR', `Stack: ${error.stack}`);
                }
            }
            
            // ═══════════════════════════════════════════════════════════
            // RESUMO FINAL
            // ═══════════════════════════════════════════════════════════
            this.addLog('INFO', '');
            this.addLog('INFO', '══════════════════════════════════════════════════════════');
            this.addLog('INFO', 'RESUMO FINAL');
            this.addLog('INFO', '══════════════════════════════════════════════════════════');
            this.addLog('INFO', `Total de ligas processadas: ${totalTabelasProcessadas}`);
            this.addLog('INFO', `Total de cards extraídos: ${todosOsCards.length}`);
            this.addLog('INFO', '══════════════════════════════════════════════════════════');
            
            this.addLog('SUCCESS', '══════════════════════════════════════════════════════════');
            this.addLog('SUCCESS', 'BUSCADOR DE PADRÕES CONCLUÍDO COM SUCESSO!');
            this.addLog('SUCCESS', `Ligas processadas: COPA, EURO, SUPER, PREMIER, TODOS`);
            this.addLog('SUCCESS', '══════════════════════════════════════════════════════════');
            
            return {
                sucesso: true,
                message: 'Todas as tabelas processadas',
                steps: this.stepCount,
                totalTabelas: totalTabelasProcessadas,
                totalCards: todosOsCards.length,
                dadosCards: todosOsCards
            };
            
        } catch (error) {
            this.addLog('ERROR', '══════════════════════════════════════════════════════════');
            this.addLog('ERROR', `ERRO NO BUSCADOR: ${error.message}`);
            this.addLog('ERROR', '══════════════════════════════════════════════════════════');
            await this.takeScreenshot('erro_buscador');
            this.addLog('ERROR-STACK', error.stack);
            
            return { sucesso: false, erro: error.message, step: this.stepCount };
        }
    }
    
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async extrairDadosCards(tituloLiga = '') {
        this.addLog('INFO', '╔══════════════════════════════════════════════════════════╗');
        this.addLog('INFO', '║          EXTRAÇÃO DE DADOS DOS CARDS (XPath)         ║');
        this.addLog('INFO', '╚══════════════════════════════════════════════════════════╝');
        
        if (tituloLiga) {
            this.addLog('INFO', `Liga: ${tituloLiga}`);
        }
        
        this.addLog('INFO', `Timestamp: ${new Date().toISOString()}`);
        
        try {
            // ═══════════════════════════════════════════════════════════
            // SCROLL ATÉ O FIM DA PÁGINA PARA CARREGAR TODOS OS CARDS
            // ═══════════════════════════════════════════════════════════
            this.addLog('INFO', '═══════════════════════════════════════════════════════════');
            this.addLog('INFO', 'ROLANDO ATÉ O FIM DA PÁGINA...');
            this.addLog('INFO', '═══════════════════════════════════════════════════════════');
            
            await this.page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            
            // Aguardar carregamento
            await this.sleep(2000);
            
            // ═══════════════════════════════════════════════════════════
            // XPath do CONTAINER dos cards
            // ═══════════════════════════════════════════════════════════
            const xpathContainer = `/html/body/app-root/div/app-robos-novo/div/div/div[5]/div[1]/div[1]/div[3]/div[3]/div[2]/div[2]/div[1]`;
            
            this.addLog('INFO', `═══════════════════════════════════════════════════════════`);
            this.addLog('INFO', `BUSCA POR CONTAINER DE CARDS:`);
            this.addLog('INFO', `  XPath Container: ${xpathContainer}`);
            
            // Encontrar o container
            const containerElements = await this.page.$x(xpathContainer);
            
            if (containerElements.length === 0) {
                this.addLog('ERROR', `Container não encontrado!`);
                return [];
            }
            
            const container = containerElements[0];
            this.addLog('SUCCESS', `Container encontrado`);
            
            // ═══════════════════════════════════════════════════════════
            // Listar TODOS os cards dentro do container
            // ═══════════════════════════════════════════════════════════
            const xpathCards = `./div[not(contains(@class, 'row'))]`;
            
            this.addLog('INFO', `═══════════════════════════════════════════════════════════`);
            this.addLog('INFO', `BUSCA POR CARDS DENTRO DO CONTAINER:`);
            this.addLog('INFO', `  XPath Cards: ${xpathCards}`);
            
            const cardsXPath = await container.$x(xpathCards);
            this.addLog('INFO', `  Cards encontrados via XPath: ${cardsXPath.length}`);
            
            if (cardsXPath.length === 0) {
                this.addLog('WARN', `Nenhum card encontrado!`);
                return [];
            }
            
            this.addLog('SUCCESS', `Total de cards encontrados: ${cardsXPath.length}`);
            
            // ═══════════════════════════════════════════════════════════
            // Processar cada card e preparar para INSERT
            // ═══════════════════════════════════════════════════════════
            const dadosCards = [];
            const dataHoraBusca = new Date().toISOString();
            
            for (let i = 0; i < cardsXPath.length; i++) {
                this.addLog('INFO', `═══════════════════════════════════════════════════════════`);
                this.addLog('INFO', `  Processando Card ${i + 1}/${cardsXPath.length}...`);
                
                try {
                    const cardData = await this.extrairDadosCardUnico(cardsXPath[i], i + 1);
                    
                    // Formatar para INSERT na tabela ResultadosCards
                    const cardParaInsert = {
                        titulo: cardData.titulo || `Card ${i + 1}`,
                        padroes: cardData.descricao || '',
                        percentual: cardData.percentualPadrao || '',
                        sg: cardData.sg || 0,
                        g1: cardData.g1 || 0,
                        g2: cardData.g2 || 0,
                        data_hora_busca: dataHoraBusca,
                        liga: tituloLiga // Adicionar título da liga na coluna Liga
                    };
                    
                    dadosCards.push(cardParaInsert);
                    
                    this.addLog('INFO', `  ✓ Card ${i + 1}: ${cardParaInsert.titulo} | ${cardParaInsert.percentual} | SG:${cardParaInsert.sg} | G1:${cardParaInsert.g1} | G2:${cardParaInsert.g2}`);
                    
                } catch (cardError) {
                    this.addLog('ERROR', `  ✗ Erro ao processar card ${i + 1}: ${cardError.message}`);
                    this.addLog('ERROR', `  Stack: ${cardError.stack}`);
                }
            }
            
            this.addLog('INFO', `═══════════════════════════════════════════════════════════`);
            this.addLog('INFO', `  RESUMO DA EXTRAÇÃO:`);
            this.addLog('INFO', `  Total de cards extraídos: ${dadosCards.length}`);
            this.addLog('INFO', `  Timestamp: ${dataHoraBusca}`);
            this.addLog('INFO', `  Liga: ${tituloLiga || 'Não informada'}`);
            this.addLog('INFO', `═══════════════════════════════════════════════════════════`);
            
            return dadosCards;
            
        } catch (error) {
            this.addLog('ERROR', `Erro ao extrair cards: ${error.message}`);
            this.addLog('ERROR', `Stack: ${error.stack}`);
            return [];
        }
    }
    
    /**
     * Salvar cards no banco de dados via API
     * @param {Array} cards - Lista de cards para inserir
     * @returns {Object} Resultado da operação
     */
    async salvarCardsNoBanco(cards) {
        try {
            const apiUrl = `${this.apiUrl}/api/ResultadosCards/inserir-lote`;
            
            this.addLog('INFO', `  ═══════════════════════════════════════════════════════════════════`);
            this.addLog('INFO', `  SALVANDO CARDS - NETWORK DO BROWSER`);
            this.addLog('INFO', `  ═══════════════════════════════════════════════════════════════════`);
            this.addLog('INFO', `  API URL: ${apiUrl}`);
            this.addLog('INFO', `  Total cards: ${cards.length}`);
            
            // Salvar dados dos cards em variável JSON
            const cardsJson = JSON.stringify(cards, null, 2);
            const bodySize = Buffer.byteLength(cardsJson, 'utf8');
            this.addLog('DEBUG', `  Body Size: ${bodySize} bytes`);
            this.addLog('DEBUG', `  Body: ${cardsJson.substring(0, 500)}...`);
            
            // ================================================
            // Configurar listener de network NO BROWSER
            // ================================================
            const networkLogs = [];
            
            // Listener para todas as respostas
            const responseListener = (response) => {
                const url = response.url();
                const status = response.status();
                
                if (url.includes('resultados-cards')) {
                    networkLogs.push({
                        type: 'response',
                        url: url,
                        status: status,
                        statusLine: response.statusLine,
                        headers: response.headers()
                    });
                    this.addLog('DEBUG', `  [NETWORK] Response: ${url} -> ${status}`);
                }
            };
            
            // Listener para requests
            const requestListener = (request) => {
                const url = request.url();
                if (url.includes('resultados-cards')) {
                    networkLogs.push({
                        type: 'request',
                        url: url,
                        method: request.method(),
                        headers: request.headers()
                    });
                    this.addLog('DEBUG', `  [NETWORK] Request: ${request.method()} ${url}`);
                }
            };
            
            // Listener para erros de rede
            const failedRequestListener = (request, response) => {
                const url = request.url();
                if (url.includes('resultados-cards')) {
                    const error = response ? response.status() : 'NO_RESPONSE';
                    networkLogs.push({
                        type: 'failed',
                        url: url,
                        error: error
                    });
                    this.addLog('ERROR', `  [NETWORK] Failed: ${url} -> ${error}`);
                }
            };
            
            // Registrar listeners
            this.page.on('response', responseListener);
            this.page.on('request', requestListener);
            this.page.on('requestfailed', failedRequestListener);
            
            this.addLog('INFO', `  [NETWORK] Listeners registrados`);
            
            // ================================================
            // Fazer requisição POST DO BROWSER (via fetch)
            // ================================================
            this.addLog('INFO', `  ═══════════════════════════════════════════════════════════════════`);
            this.addLog('INFO', `  ENVIANDO POST VIA BROWSER FETCH...`);
            this.addLog('INFO', `  ═══════════════════════════════════════════════════════════════════`);
            
            const response = await this.page.evaluate(async (url, postData) => {
                const startTime = Date.now();
                
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: postData
                    });
                    
                    const endTime = Date.now();
                    
                    // Tentar obter corpo da resposta
                    let body = '';
                    try {
                        body = await response.text();
                    } catch (e) {
                        body = 'Unable to read body';
                    }
                    
                    return {
                        success: response.ok,
                        status: response.status,
                        statusText: response.statusText,
                        body: body,
                        url: url,
                        duration: endTime - startTime
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message,
                        name: error.name,
                        stack: error.stack,
                        url: url
                    };
                }
            }, apiUrl, cardsJson);
            
            // Remover listeners após a requisição
            this.page.off('response', responseListener);
            this.page.off('request', requestListener);
            this.page.off('requestfailed', failedRequestListener);
            
            // ================================================
            // Log completo da resposta
            // ================================================
            this.addLog('INFO', `  ═══════════════════════════════════════════════════════════════════`);
            this.addLog('INFO', `  RESULTADO DA REQUISIÇÃO`);
            this.addLog('INFO', `  ═══════════════════════════════════════════════════════════════════`);
            this.addLog('INFO', `  Status: ${response.status} ${response.statusText || ''}`);
            this.addLog('INFO', `  Success: ${response.success}`);
            this.addLog('INFO', `  Duration: ${response.duration || 'N/A'}ms`);
            
            if (response.error) {
                this.addLog('ERROR', `  Fetch Error: ${response.error}`);
                this.addLog('ERROR', `  Error Name: ${response.name || 'N/A'}`);
                this.addLog('ERROR', `  Stack: ${response.stack || 'N/A'}`);
            }
            
            this.addLog('DEBUG', `  Response Body: ${response.body || 'N/A'}`);
            this.addLog('DEBUG', `  Network Logs: ${JSON.stringify(networkLogs, null, 2)}`);
            
            if (!response.success && response.body) {
                this.addLog('ERROR', `  ═══════════════════════════════════════════════════════════════════`);
                this.addLog('ERROR', `  ERRO! Body da resposta: ${response.body}`);
                this.addLog('ERROR', `  ═══════════════════════════════════════════════════════════════════`);
            }
            
            // Tentar parsear JSON
            let parsedResult;
            if (response.body) {
                try {
                    parsedResult = JSON.parse(response.body);
                    this.addLog('DEBUG', `  Parsed JSON: ${JSON.stringify(parsedResult, null, 2)}`);
                } catch (e) {
                    parsedResult = { raw: response.body };
                }
            }
            
            if (response.success) {
                this.addLog('SUCCESS', `  ✓ Sucesso! Registros: ${parsedResult?.saved || 'N/A'}`);
                return { success: true, ...parsedResult, networkLogs };
            } else {
                this.addLog('ERROR', `  ✗ Falha: ${response.status} - ${response.statusText}`);
                return {
                    success: false,
                    error: response.body || response.error || 'Erro desconhecido',
                    status: response.status,
                    networkLogs
                };
            }
            
        } catch (error) {
            this.addLog('ERROR', `  ✗ Exceção ao salvar cards: ${error.message}`);
            this.addLog('ERROR', `  Stack: ${error.stack}`);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Extrair dados de um único card
     * @param {Element} cardElement - Elemento do card
     * @param {number} indice - Índice do card
     * @returns {Object} Dados extraídos do card
     */
    async extrairDadosCardUnico(cardElement, indice) {
        const dadosCard = {
            indice: indice,
            titulo: '',
            descricao: '',
            status: '',
            percentualPadrao: '',
            sg: 0,
            g1: 0,
            g2: 0,
            informacoesAdicionais: []
        };
        
        try {
            // ═══════════════════════════════════════════════════════════
            // 1. Extrair Título (primeiro <p> ou elemento com classe title)
            // ═══════════════════════════════════════════════════════════
            const titulos = await cardElement.$$('p:first-of-type, p.titulo-principal, .card-title, [class*="titulo"]');
            if (titulos.length > 0) {
                dadosCard.titulo = await titulos[0].evaluate(el => el.innerText.trim());
            } else {
                // Tentar extrair do texto completo do card
                const textoCard = await cardElement.evaluate(el => el.innerText);
                const linhas = textoCard.split('\n').filter(l => l.trim().length > 0);
                if (linhas.length > 0) {
                    dadosCard.titulo = linhas[0].trim();
                }
            }
            
            // ═══════════════════════════════════════════════════════════
            // 2. Extrair Descrição (segundo <p> ou elementos com classe description/descricao)
            // ═══════════════════════════════════════════════════════════
            const descricoes = await cardElement.$$('p:nth-of-type(2), p.descricao, [class*="descricao"], [class*="description"]');
            if (descricoes.length > 0) {
                dadosCard.descricao = await descricoes[0].evaluate(el => el.innerText.trim());
            }
            
            // ═══════════════════════════════════════════════════════════
            // 3. Extrair Status (elementos com classe status, badge, etc.)
            // ═══════════════════════════════════════════════════════════
            const statusElements = await cardElement.$$('[class*="status"], .badge, .tag, [class*="ativo"], [class*="inativo"]');
            if (statusElements.length > 0) {
                dadosCard.status = await statusElements[0].evaluate(el => el.innerText.trim());
            }
            
            // ═══════════════════════════════════════════════════════════
            // 4. Extrair Percentual Padrão (elementos com %)
            // ═══════════════════════════════════════════════════════════
            const estatisticasBox = await cardElement.$$('p.estatisticas-box, [class*="estatisticas-box"], [class*="percentual"]');
            if (estatisticasBox.length > 0) {
                const textoEstatisticas = await estatisticasBox[0].evaluate(el => el.innerText.trim());
                dadosCard.percentualPadrao = textoEstatisticas;
            }
            
            // ═══════════════════════════════════════════════════════════
            // 5. Extrair estatísticas SG, G1, G2 - ABORDAGEM MELHORADA
            // ═══════════════════════════════════════════════════════════
            // Primeiro, obter o texto completo do card para análise
            const textoCompletoCard = await cardElement.evaluate(el => el.innerText);
            
            // Regex para encontrar padrões como "SG: 10", "G1: 5", "G2: 3" ou "SG 10", "G1 5", "G2 3"
            const regexSG = /SG[:\s]+(\d+)/i;
            const regexG1 = /G1[:\s]+(\d+)/i;
            const regexG2 = /G2[:\s]+(\d+)/i;
            
            const matchSG = textoCompletoCard.match(regexSG);
            const matchG1 = textoCompletoCard.match(regexG1);
            const matchG2 = textoCompletoCard.match(regexG2);
            
            if (matchSG) {
                dadosCard.sg = parseInt(matchSG[1], 10);
                this.addLog('DEBUG', `  Card ${indice}: SG encontrado via regex: ${dadosCard.sg}`);
            }
            
            if (matchG1) {
                dadosCard.g1 = parseInt(matchG1[1], 10);
                this.addLog('DEBUG', `  Card ${indice}: G1 encontrado via regex: ${dadosCard.g1}`);
            }
            
            if (matchG2) {
                dadosCard.g2 = parseInt(matchG2[1], 10);
                this.addLog('DEBUG', `  Card ${indice}: G2 encontrado via regex: ${dadosCard.g2}`);
            }
            
            // Se ainda não encontrou, tentar extrair de spans
            if (dadosCard.sg === 0 || dadosCard.g1 === 0 || dadosCard.g2 === 0) {
                const spans = await cardElement.$$('span');
                
                for (const span of spans) {
                    const textoSpan = await span.evaluate(el => el.innerText.trim());
                    
                    // SG: span que contenha "SG" ou pai contenha "SG"
                    if (dadosCard.sg === 0 && textoSpan.match(/^\d+$/)) {
                        const parentText = await span.evaluate(el => el.parentElement?.innerText || '');
                        const spanTextLower = textoSpan.toLowerCase();
                        if (parentText.toLowerCase().includes('sg') || spanTextLower === 'sg') {
                            dadosCard.sg = parseInt(textoSpan, 10);
                            this.addLog('DEBUG', `  Card ${indice}: SG encontrado via span: ${dadosCard.sg}`);
                        }
                    }
                    
                    // G1: span que contenha "G1" ou pai contenha "G1"
                    if (dadosCard.g1 === 0 && textoSpan.match(/^\d+$/)) {
                        const parentText = await span.evaluate(el => el.parentElement?.innerText || '');
                        const spanTextLower = textoSpan.toLowerCase();
                        if (parentText.toLowerCase().includes('g1') || spanTextLower === 'g1') {
                            dadosCard.g1 = parseInt(textoSpan, 10);
                            this.addLog('DEBUG', `  Card ${indice}: G1 encontrado via span: ${dadosCard.g1}`);
                        }
                    }
                    
                    // G2: span que contenha "G2" ou pai contenha "G2"
                    if (dadosCard.g2 === 0 && textoSpan.match(/^\d+$/)) {
                        const parentText = await span.evaluate(el => el.parentElement?.innerText || '');
                        const spanTextLower = textoSpan.toLowerCase();
                        if (parentText.toLowerCase().includes('g2') || spanTextLower === 'g2') {
                            dadosCard.g2 = parseInt(textoSpan, 10);
                            this.addLog('DEBUG', `  Card ${indice}: G2 encontrado via span: ${dadosCard.g2}`);
                        }
                    }
                }
            }
            
            // ═══════════════════════════════════════════════════════════
            // 6. Fallback: extrair números do texto completo (sempre executa se SG/G1/G2 = 0)
            // ═══════════════════════════════════════════════════════════
            if (dadosCard.sg === 0 || dadosCard.g1 === 0 || dadosCard.g2 === 0) {
                const numeros = textoCompletoCard.match(/\d+/g);
                this.addLog('DEBUG', `  Card ${indice}: Números encontrados no texto: ${JSON.stringify(numeros)}`);
                
                // Tentar identificar os números corretos para SG, G1, G2
                // Buscar no texto completo por padrões específicos
                const todasCorrespondencias = [];
                
                // Encontrar todas as posições de "SG", "G1", "G2" no texto
                let posicaoSG = -1, posicaoG1 = -1, posicaoG2 = -1;
                
                const matchSGPos = textoCompletoCard.search(/SG/i);
                const matchG1Pos = textoCompletoCard.search(/G1/i);
                const matchG2Pos = textoCompletoCard.search(/G2/i);
                
                if (matchSGPos >= 0) {
                    // Pegar o número mais próximo após "SG"
                    const textoAposSG = textoCompletoCard.substring(matchSGPos);
                    const numeroAposSG = textoAposSG.match(/\d+/);
                    if (numeroAposSG) {
                        dadosCard.sg = parseInt(numeroAposSG[0], 10);
                        this.addLog('DEBUG', `  Card ${indice}: SG encontrado após 'SG': ${dadosCard.sg}`);
                    }
                }
                
                if (matchG1Pos >= 0) {
                    const textoAposG1 = textoCompletoCard.substring(matchG1Pos);
                    const numeroAposG1 = textoAposG1.match(/\d+/);
                    if (numeroAposG1) {
                        dadosCard.g1 = parseInt(numeroAposG1[0], 10);
                        this.addLog('DEBUG', `  Card ${indice}: G1 encontrado após 'G1': ${dadosCard.g1}`);
                    }
                }
                
                if (matchG2Pos >= 0) {
                    const textoAposG2 = textoCompletoCard.substring(matchG2Pos);
                    const numeroAposG2 = textoAposG2.match(/\d+/);
                    if (numeroAposG2) {
                        dadosCard.g2 = parseInt(numeroAposG2[0], 10);
                        this.addLog('DEBUG', `  Card ${indice}: G2 encontrado após 'G2': ${dadosCard.g2}`);
                    }
                }
                
                // Se ainda não encontrou, usar fallback com números sequenciais
                if (numeros && numeros.length >= 3 && (dadosCard.sg === 0 || dadosCard.g1 === 0 || dadosCard.g2 === 0)) {
                    this.addLog('DEBUG', `  Card ${indice}: Usando fallback com números sequenciais`);
                    if (dadosCard.sg === 0) dadosCard.sg = parseInt(numeros[0], 10);
                    if (dadosCard.g1 === 0) dadosCard.g1 = parseInt(numeros[1], 10);
                    if (dadosCard.g2 === 0) dadosCard.g2 = parseInt(numeros[2], 10);
                }
            }
            
            // ═══════════════════════════════════════════════════════════
            // 7. Limpar dados extraídos
            // ═══════════════════════════════════════════════════════════
            if (dadosCard.percentualPadrao) {
                dadosCard.percentualPadrao = dadosCard.percentualPadrao.replace(/\s+/g, ' ').trim();
            }
            
            this.addLog('DEBUG', `  ✓ Card ${indice}: ${dadosCard.titulo} | ${dadosCard.percentualPadrao} | SG:${dadosCard.sg} | G1:${dadosCard.g1} | G2:${dadosCard.g2}`);
            
            return dadosCard;
            
        } catch (error) {
            this.addLog('ERROR', `  ✗ Erro ao extrair dados do card ${indice}: ${error.message}`);
            this.addLog('ERROR', `  Stack: ${error.stack}`);
            return dadosCard;
        }
    }
    
    // /**
    //  * Executar buscador de padrões com parâmetros
    //  * @param {Object} params - Parâmetros do buscador
    //  */
    // async executarBuscadorPadroes(params = {}) {
    //     const { parametros } = params;
        
    //     this.addLog('INFO', '╔══════════════════════════════════════════════════════════╗');
    //     this.addLog('INFO', '║          BUSCADOR DE PADRÕES                        ║');
    //     this.addLog('INFO', '╚══════════════════════════════════════════════════════════╝');
        
    //     const config = parametros || {
    //         maximoPulos: 80,
    //         percentualInicial: 50,
    //         totalRegistros: 10,
    //         stakeInicial: 10,
    //         multiplicador: 2
    //     };
        
    //     this.addLog('INFO', `Configuração: ${JSON.stringify(config)}`);
        
    //     try {
    //         // Navegar para página de bots
    //         const botsUrl = `${this.config.urlBase}/bots/novo`;
    //         this.addLog('INFO', `Navegando para: ${botsUrl}`);
    //         await this.page.goto(botsUrl, { waitUntil: 'networkidle0', timeout: 60000 });
    //         await this.sleep(3000);
            
    //         // Clicar em Buscar Padrões
    //         const buscarPadroesSelector = 'body > app-root > div > app-robos-novo > div > div > div:nth-child(5) > div > div.col-md-6.px-3 > div.col-md-12.pt-1 > button.btn.btn-success.ms-2';
    //         const buscarPadroesBtn = await this.page.$(buscarPadroesSelector);
            
    //         if (buscarPadroesBtn) {
    //             const btnText = await buscarPadroesBtn.evaluate(el => el.innerText.trim());
    //             this.addLog('SUCCESS', `Botão encontrado: "${btnText}"`);
    //             await buscarPadroesBtn.click();
    //             await this.sleep(2000);
    //         } else {
    //             this.addLog('ERROR', 'Botão Buscar Padrões não encontrado!');
    //             return { sucesso: false, erro: 'Botão Buscar Padrões não encontrado' };
    //         }
            
    //         // Extrair cards
    //         const dadosCards = await this.extrairDadosCards('Busca Manual');
            
    //         if (dadosCards && dadosCards.length > 0) {
    //             this.addLog('SUCCESS', `${dadosCards.length} cards extraídos`);
    //         }
            
    //         return {
    //             sucesso: true,
    //             steps: this.stepCount,
    //             totalCards: dadosCards.length,
    //             dadosCards: dadosCards
    //         };
            
    //     } catch (error) {
    //         this.addLog('ERROR', `Erro no buscador: ${error.message}`);
    //         return { sucesso: false, erro: error.message, step: this.stepCount };
    //     }
    // }
    
    /**
     * Método main.async para executar o robô
     */
    async executar() {
        try {
            // Inicializar browser
            await this.init();
            
            // Fazer login
            const loginResult = await this.fazerLogin();
            if (!loginResult) {
                this.addLog('ERROR', 'Falha no login. Encerrando.');
                await this.close();
                return { sucesso: false, erro: 'Falha no login' };
            }
            
            // Executar configurações do robô
            this.addLog('INFO', '========================================');
            this.addLog('INFO', 'ROBÔ CONFIGURADO E PRONTO PARA USO!');
            this.addLog('INFO', '========================================');
            this.addLog('INFO', 'O robô está logado e pronto para executar comandos.');
            this.addLog('INFO', 'Você pode navegar para /bots/novo para começar.');
            this.addLog('INFO', 'O navegador permanecerá aberto para interação manual.');
            
            return { sucesso: true, message: 'Robô configurado com sucesso' };
            
        } catch (error) {
            this.addLog('ERROR', `Erro durante execução: ${error.message}`);
            this.addLog('ERROR', `Stack: ${error.stack}`);
            return { sucesso: false, erro: error.message };
        }
    }
    
    // Alias para compatibilidade - executarBuscadorPadroes chama executarBuscadorTodasTabelas
    async executarBuscadorPadroes(params = {}) {
        return this.executarBuscadorTodasTabelas(params);
    }
}

module.exports = BBTipsRobo;
