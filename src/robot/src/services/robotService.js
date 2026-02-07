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
        this.dadosCards = []; // Armazenar dados dos cards extraídos
        
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
    
    async executarBuscadorPadroes(config) {
        this.addLog('INFO', '---------------------------------------');
        this.addLog('INFO', 'EXECUTANDO BUSCADOR DE PADRÕES');
        this.addLog('INFO', '---------------------------------------');
        this.addLog('INFO', `URL Base do robô: ${this.config.urlBase}`);
        
        try {
            // =========================================
            // PASSO 1: Navegar para página de bots
            // =========================================
            const botsUrl = `${this.config.urlBase}/bots/novo`;
            this.addLog('INFO', `Navegando para: ${botsUrl}`);
            
            // Debug: verificar URL atual antes de navegar
            const currentUrlBefore = await this.page.url();
            this.addLog('DEBUG', `URL atual antes de navegar: ${currentUrlBefore}`);
            
            await this.page.goto(botsUrl, { waitUntil: 'networkidle0', timeout: 60000 });
            
            // Debug: verificar URL depois de navegar
            const currentUrlAfter = await this.page.url();
            this.addLog('DEBUG', `URL após navegar: ${currentUrlAfter}`);
            
            await this.sleep(3000);
            await this.takeScreenshot('01_pagina_bots');
            
            // Verificar elementos da página
            const bodyContent = await this.page.$eval('body', el => el.innerText.substring(0, 200));
            this.addLog('DEBUG', `Conteúdo da página: ${bodyContent}...`);
            
            // =========================================
            // PASSO 2: Clicar em "Buscar Padrões"
            // =========================================
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
            
            // =========================================
            // PASSO 3: No campo "Máximo Pulos" setar 80
            // =========================================
            this.addLog('INFO', 'Procurando campo Máximo Pulos...');
            
            // Tentar encontrar o ng-select de Pulos
            const pulosNgSelect = await this.page.$('ng-select[placeholder*="Pulos"]');
            
            if (pulosNgSelect) {
                this.addLog('SUCCESS', 'Campo Máximo Pulos encontrado');
                await pulosNgSelect.click();
                await this.sleep(500);
                
                // Procurar opção com valor 80
                const opcoes = await this.page.$('ng-dropdown-panel .ng-option');
                let pulosSetado = false;
                
                for (const opcao of opcoes) {
                    const texto = await opcao.evaluate(el => el.textContent.trim());
                    this.addLog('INFO', `Opção encontrada: "${texto}"`);
                    if (texto === '80') {
                        await opcao.click();
                        this.addLog('SUCCESS', 'Máximo Pulos configurado: 80');
                        pulosSetado = true;
                        break;
                    }
                }
                
                if (!pulosSetado) {
                    // Se não encontrar 80, selecionar primeira opção disponível
                    if (opcoes.length > 0) {
                        await opcoes[0].click();
                        this.addLog('WARN', 'Opção 80 não encontrada, usando primeira opção disponível');
                    } else {
                        this.addLog('WARN', 'Nenhuma opção disponível para Máximo Pulos');
                    }
                }
            } else {
                this.addLog('WARN', 'Campo Máximo Pulos não encontrado via ng-select');
                
                // Tentar via XPath ou outro seletor
                const pulosInput = await this.page.$('input[placeholder*="Pulos"], input[name*="pulos"]');
                if (pulosInput) {
                    await pulosInput.focus();
                    await this.page.keyboard.down('Control');
                    await this.page.keyboard.press('A');
                    await this.page.keyboard.up('Control');
                    await this.page.keyboard.type('80');
                    this.addLog('SUCCESS', 'Máximo Pulos preenchido: 80');
                } else {
                    this.addLog('WARN', 'Campo Máximo Pulos não encontrado');
                }
            }
            
            // =========================================
            // PASSO 4: Clicar em Buscar
            // =========================================
            this.addLog('INFO', 'Procurando botão Buscar no modal...');
            const buscarModalSelector = '#myModal-buscador > div > div > div > div > div > div > div > div.col-md-12.pt-3 > button';
            const buscarModalBtn = await this.page.$(buscarModalSelector);
            
            if (buscarModalBtn) {
                const btnText = await buscarModalBtn.evaluate(el => el.innerText.trim());
                this.addLog('SUCCESS', `Botão Buscar encontrado: "${btnText}"`);
                await buscarModalBtn.click();
                this.addLog('INFO', 'Clicou em Buscar, aguardando resultados...');
                await this.sleep(5000);
                await this.takeScreenshot('03_resultados_busca');
            } else {
                // Tentar XPath alternativo
                const buscarXpathAlternativo = "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'buscar')]";
                const buscarBtnAlt = await this.page.$x(buscarXpathAlternativo);
                if (buscarBtnAlt.length > 0) {
                    await buscarBtnAlt[0].click();
                    this.addLog('SUCCESS', 'Clicou em Buscar (via XPath alternativo)');
                    await this.sleep(5000);
                    await this.takeScreenshot('03_resultados_busca_alt');
                } else {
                    this.addLog('ERROR', 'Botão Buscar não encontrado!');
                    return { sucesso: false, erro: 'Botão Buscar não encontrado' };
                }
            }
            
            // =========================================
            // PASSO 5: Clicar na primeira linha do 5º grid para usar padrão
            // =========================================
            this.addLog('INFO', 'Procurando resultados da busca...');
            
            // Aguardar carregamento da tabela
            await this.sleep(2000);
            
            // Usar selector específico para a 5ª tabela do modal
            const selectorQuintaTabela = '#myModal-buscador > div > div > div:nth-child(4) > div:nth-child(5) > div > table';
            const quintaTabela = await this.page.$(selectorQuintaTabela);
            
            let linhaSelecionada = false;
            
            if (quintaTabela) {
                this.addLog('SUCCESS', 'Quinta tabela encontrada');
                
                // Tentar clicar na primeira linha da tabela
                const primeiraLinha = await quintaTabela.$('tbody tr:nth-child(1)');
                
                if (primeiraLinha) {
                    this.addLog('INFO', 'Clicando na primeira linha da quinta tabela...');
                    await primeiraLinha.click();
                    await this.sleep(1000);
                    
                    // Verificar se apareceu dialog para confirmar
                    this.page.on('dialog', async dialog => {
                        this.addLog('INFO', `Dialog detectado: "${dialog.message()}"`);
                        await dialog.accept();
                    });
                    
                    await this.takeScreenshot('04_linha_selecionada');
                    linhaSelecionada = true;
                } else {
                    this.addLog('WARN', 'Primeira linha não encontrada na quinta tabela');
                }
            } else {
                this.addLog('WARN', 'Quinta tabela não encontrada com selector específico');
                
                // Fallback: tentar qualquer tabela
                this.addLog('INFO', 'Tentando fallback com qualquer tabela...');
                const linhas = await this.page.$('table tbody tr');
                
                if (linhas.length > 0) {
                    this.addLog('SUCCESS', `Encontradas ${linhas.length} linhas em tabelas`);
                    await linhas[0].click();
                    await this.sleep(1000);
                    await this.takeScreenshot('04_linha_fallback');
                    linhaSelecionada = true;
                }
            }
            
            if (!linhaSelecionada) {
                this.addLog('WARN', 'Não foi possível selecionar nenhuma linha');
            }
            
            // =========================================
            // PASSO 6: Clicar no botão Sim do dialog (SweetAlert2)
            // =========================================
            this.addLog('INFO', 'Procurando dialog SweetAlert2...');
            await this.sleep(1500);
            
            // Tentar localizar o modal SweetAlert2
            let simButton = null;
            
            // Método 1: Procurar pelo selector do SweetAlert2
            const modal = await this.page.$('.swal2-modal');
            if (modal) {
                this.addLog('SUCCESS', 'Modal SweetAlert2 encontrado');
                simButton = await modal.$('.swal2-confirm');
                if (simButton) {
                    const btnText = await simButton.evaluate(el => el.innerText.trim());
                    this.addLog('SUCCESS', `Botão encontrado: "${btnText}"`);
                }
            }
            
            // Método 2: Procurar por selector alternativo
            if (!simButton) {
                simButton = await this.page.$('.sweet-alert .confirm');
            }
            
            // Método 3: XPath para botão Sim
            if (!simButton) {
                const simXpathAlternatives = [
                    "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'sim')]",
                    "//button[@class='swal2-confirm swal2-styled']",
                    "//button[contains(@class, 'confirm')]"
                ];
                for (const xpath of simXpathAlternatives) {
                    simButton = await this.page.$x(xpath);
                    if (simButton && simButton.length > 0) {
                        simButton = simButton[0];
                        const btnText = await simButton.evaluate(el => el.innerText.trim());
                        this.addLog('SUCCESS', `Botão encontrado via XPath: "${btnText}"`);
                        break;
                    }
                }
            }
            
            // Método 4: Selector original do usuário (fallback)
            if (!simButton) {
                simButton = await this.page.$('/html/body/div[2]/div/div[6]/button[1]');
            }
            
            if (simButton) {
                const btnText = await simButton.evaluate(el => el.innerText.trim());
                this.addLog('SUCCESS', `Clicando em "${btnText}"`);
                await simButton.click();
                this.addLog('INFO', 'Clicou no botão Sim');
                await this.sleep(1500);
                await this.takeScreenshot('05_dialog_sim');
            } else {
                this.addLog('WARN', 'Botão Sim não encontrado, tentando fechar dialog...');
                // Tentar fechar com ESC ou clicar fora
                await this.page.keyboard.press('Escape');
                await this.sleep(1000);
            }
            
            // =========================================
            // PASSO 7: Clicar no elemento div[2]
            // =========================================
            this.addLog('INFO', 'Procurando elemento para clicar...');
            await this.sleep(1000);
            
            const div2Xpath = "/html/body/app-root/div/app-robos-novo/div/div/div[5]/div[1]/div[1]/div[3]/div[2]";
            const div2Elements = await this.page.$x(div2Xpath);
            
            if (div2Elements.length > 0) {
                this.addLog('SUCCESS', 'Elemento encontrado');
                await div2Elements[0].click();
                this.addLog('INFO', 'Clicou no elemento div[2]');
                await this.sleep(1000);
                await this.takeScreenshot('06_div2_clicado');
            } else {
                this.addLog('WARN', 'Elemento div[2] não encontrado');
            }
            
            // =========================================
            // PASSO 8: Clicar no span final
            // =========================================
            this.addLog('INFO', 'Procurando span para clicar...');
            await this.sleep(1000);
            
            const spanXpath = "/html/body/app-root/div/app-robos-novo/div/div/div[5]/div[1]/div[1]/div[3]/div[3]/div[2]/div[2]/div[2]/span";
            const spanElements = await this.page.$x(spanXpath);
            
            if (spanElements.length > 0) {
                const spanText = await spanElements[0].evaluate(el => el.innerText.trim());
                this.addLog('SUCCESS', `Span encontrado: "${spanText}"`);
                await spanElements[0].click();
                this.addLog('INFO', 'Clicou no span');
                await this.sleep(1000);
                await this.takeScreenshot('07_span_clicado');
            } else {
                this.addLog('WARN', 'Span não encontrado');
            }
            
            // =========================================
            // EXTRAÇÃO DE DADOS DOS CARDS
            // =========================================
            this.addLog('INFO', '========================================');
            this.addLog('INFO', 'EXTRAINDO DADOS DOS CARDS');
            this.addLog('INFO', '========================================');
            
            const dadosCards = await this.extrairDadosCards();
            
            if (dadosCards && dadosCards.length > 0) {
                this.addLog('SUCCESS', `Extraídos ${dadosCards.length} cards com sucesso`);
                this.dadosCards = dadosCards; // Salvar para uso externo
                dadosCards.forEach((card, index) => {
                    this.addLog('INFO', `Card ${index + 1}: ${card.titulo} | Percentual: ${card.percentual} | SG: ${card.sg} | G1: ${card.g1} | G2: ${card.g2}`);
                });
            } else {
                this.addLog('WARN', 'Nenhum card encontrado');
                this.dadosCards = [];
            }
            
            this.addLog('SUCCESS', '========================================');
            this.addLog('SUCCESS', 'BUSCADOR DE PADRÕES CONCLUÍDO COM SUCESSO!');
            this.addLog('SUCCESS', '========================================');
            return { 
                sucesso: true, 
                message: 'Fluxo concluído', 
                steps: this.stepCount,
                dadosCards: dadosCards
            };
            
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
    
    async extrairDadosCards() {
        this.addLog('INFO', '╔══════════════════════════════════════════════════════════╗');
        this.addLog('INFO', '║          EXTRAÇÃO DE DADOS DOS CARDS (XPath)         ║');
        this.addLog('INFO', '╚══════════════════════════════════════════════════════════╝');
        this.addLog('INFO', `Timestamp: ${new Date().toISOString()}`);
        
        try {
            // Esperar pelos cards carregarem
            await this.sleep(2000);
            
            // ═══════════════════════════════════════════════════════════
            // XPath do CONTAINER dos cards
            // ═══════════════════════════════════════════════════════════
            const xpathContainer = `/html/body/app-root/div/app-robos-novo/div/div/div[5]/div[1]/div[1]/div[3]/div[3]/div[2]/div[2]/div[1]`;
            
            this.addLog('INFO', `══════════════════════════════════════════════════════════`);
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
            // Cada card é um div direto dentro do container
            // ═══════════════════════════════════════════════════════════
            const xpathCards = `./div[not(contains(@class, 'row'))]`;
            
            this.addLog('INFO', `══════════════════════════════════════════════════════════`);
            this.addLog('INFO', `BUSCA POR CARDS DENTRO DO CONTAINER:`);
            this.addLog('INFO', `  XPath Cards: ${xpathCards}`);
            
            const cardsXPath = await container.$x(xpathCards);
            this.addLog('INFO', `  Cards encontrados via XPath: ${cardsXPath.length}`);
            
            // Se não encontrou com XPath relativo, tentar divs diretos
            if (cardsXPath.length === 0) {
                const allDivs = await container.$$('div');
                this.addLog('INFO', `  Total de divs no container: ${allDivs.length}`);
                
                // Filtrar apenas divs que parecem ser cards (têm conteúdo relevante)
                const potentialCards = [];
                for (const div of allDivs) {
                    const text = await div.evaluate(el => el.innerText.trim());
                    if (text.length > 10 && (text.includes('%') || text.includes('SG') || text.includes('G1') || text.includes('G2'))) {
                        potentialCards.push(div);
                    }
                }
                this.addLog('INFO', `  Cards potenciais filtrados: ${potentialCards.length}`);
                cardsXPath.push(...potentialCards);
            }
            
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
                    
                    // Formatar para INSERT na tabela resultados_cards
                    const cardParaInsert = {
                        titulo: cardData.titulo || `Card ${i + 1}`,
                        padroes: cardData.descricao || '',
                        percentual: cardData.percentualPadrao || '',
                        sg: cardData.sg || 0,
                        g1: cardData.g1 || 0,
                        g2: cardData.g2 || 0,
                        data_hora_busca: dataHoraBusca
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
            this.addLog('INFO', `═══════════════════════════════════════════════════════════`);
            
            // ═══════════════════════════════════════════════════════════
            // Salvar cards no banco de dados via API
            // ═══════════════════════════════════════════════════════════
            this.addLog('INFO', `═══════════════════════════════════════════════════════════`);
            this.addLog('INFO', `SALVANDO CARDS NO BANCO DE DADOS...`);
            this.addLog('INFO', `  Total de cards para inserir: ${dadosCards.length}`);
            
            const insertResult = await this.salvarCardsNoBanco(dadosCards);
            
            if (insertResult && insertResult.success) {
                this.addLog('SUCCESS', `✓ ${insertResult.registros_inseridos} cards inseridos com sucesso!`);
            } else {
                this.addLog('ERROR', `Erro ao salvar cards: ${insertResult ? insertResult.error : 'Resposta inválida'}`);
            }
            
            // ═══════════════════════════════════════════════════════════
            // Resumo da extração
            // ═══════════════════════════════════════════════════════════
            this.addLog('INFO', `═══════════════════════════════════════════════════════════`);
            this.addLog('INFO', `RESUMO DA EXTRAÇÃO:`);
            this.addLog('INFO', `  Total de cards processados: ${dadosCards.length}`);
            this.addLog('INFO', `  Cards inseridos no banco: ${insertResult && insertResult.registros_inseridos ? insertResult.registros_inseridos : 0}`);
            this.addLog('INFO', `  Timestamp: ${dataHoraBusca}`);
            
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
            const apiUrl = `${this.apiUrl}/api/inserir-cards`;
            
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
                        statusLine: response.statusLine, // corrigido: é propriedade, não método
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
                this.addLog('SUCCESS', `  ✓ Sucesso! Registros: ${parsedResult?.registros_inseridos || 'N/A'}`);
                return { success: true, ...parsedResult, networkLogs };
            } else {
                this.addLog('ERROR', `  ✗ Falha: ${response.status} - ${response.statusText}`);
                return {
                    success: false,
                    error: response.error || `HTTP ${response.status}`,
                    status: response.status,
                    statusText: response.statusText,
                    body: response.body,
                    parsed: parsedResult,
                    networkLogs
                };
            }
            
        } catch (error) {
            this.addLog('ERROR', `  ═══════════════════════════════════════════════════════════════════`);
            this.addLog('ERROR', `  ERRO GERAL!`);
            this.addLog('ERROR', `  Message: ${error.message}`);
            this.addLog('ERROR', `  Stack: ${error.stack}`);
            this.addLog('ERROR', `  ═══════════════════════════════════════════════════════════════════`);
            return { success: false, error: error.message, stack: error.stack };
        }
    }
    
    /**
     * Extrair dados de um único card
     * @param {Element} cardElement - Elemento do card
     * @param {number} indice - Índice do card
     * @returns {Object} Dados do card
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
            // 5. Extrair estatísticas SG, G1, G2 de spans
            // ═══════════════════════════════════════════════════════════
            const spans = await cardElement.$$('span');
            
            for (const span of spans) {
                const textoSpan = await span.evaluate(el => el.innerText.trim());
                
                // SG: Primeira estatística
                if (textoSpan.match(/^\d+$/) && dadosCard.sg === 0) {
                    const parentText = await span.evaluate(el => el.parentElement?.innerText || '');
                    if (parentText.toLowerCase().includes('sg')) {
                        dadosCard.sg = parseInt(textoSpan);
                    }
                }
                
                // G1: Segunda estatística
                if (textoSpan.match(/^\d+$/) && dadosCard.g1 === 0) {
                    const parentText = await span.evaluate(el => el.parentElement?.innerText || '');
                    if (parentText.toLowerCase().includes('g1')) {
                        dadosCard.g1 = parseInt(textoSpan);
                    }
                }
                
                // G2: Terceira estatística
                if (textoSpan.match(/^\d+$/) && dadosCard.g2 === 0) {
                    const parentText = await span.evaluate(el => el.parentElement?.innerText || '');
                    if (parentText.toLowerCase().includes('g2')) {
                        dadosCard.g2 = parseInt(textoSpan);
                    }
                }
                
                // Fallback: se ainda não encontrou, usar a ordem dos spans
                if (textoSpan.match(/^\d+$/) && dadosCard.sg === 0) {
                    dadosCard.sg = parseInt(textoSpan);
                } else if (textoSpan.match(/^\d+$/) && dadosCard.g1 === 0) {
                    dadosCard.g1 = parseInt(textoSpan);
                } else if (textoSpan.match(/^\d+$/) && dadosCard.g2 === 0) {
                    dadosCard.g2 = parseInt(textoSpan);
                }
            }
            
            // ═══════════════════════════════════════════════════════════
            // 6. Fallback: extrair tudo via XPath
            // ═══════════════════════════════════════════════════════════
            if (!dadosCard.titulo || !dadosCard.percentualPadrao) {
                const textoCompleto = await cardElement.evaluate(el => el.innerText);
                const linhas = textoCompleto.split('\n').filter(l => l.trim().length > 0);
                
                // Título na primeira linha
                if (linhas.length > 0 && !dadosCard.titulo) {
                    dadosCard.titulo = linhas[0].trim();
                }
                
                // Percentual na segunda linha
                if (linhas.length > 1 && !dadosCard.percentualPadrao) {
                    const possivelPercentual = linhas[1].trim();
                    if (possivelPercentual.includes('%')) {
                        dadosCard.percentualPadrao = possivelPercentual;
                    }
                }
                
                // Estatísticas numéricas
                const numeros = textoCompleto.match(/\d+/g);
                if (numeros && numeros.length >= 3) {
                    if (dadosCard.sg === 0) dadosCard.sg = parseInt(numeros[0]);
                    if (dadosCard.g1 === 0) dadosCard.g1 = parseInt(numeros[1]);
                    if (dadosCard.g2 === 0) dadosCard.g2 = parseInt(numeros[2]);
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
    
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
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
}

module.exports = BBTipsRobo;
