// ═══════════════════════════════════════════════════════════════════════════════════
// CORREÇÕES PARA robotService.js
// ═══════════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════════
// CORREÇÃO 1: Extrair título da liga (substituir linhas 381-402)
// ═══════════════════════════════════════════════════════════════════════════════════
/*
// LINHAS ANTIGAS (381-402):
                        // ═══════════════════════════════════════════════════════════════
                        // 6.6: Extrair título da liga
                        // ═══════════════════════════════════════════════════════════════
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
*/

// LINHAS CORRIGIDAS (381-402):
                        // ═══════════════════════════════════════════════════════════════
                        // 6.6: Extrair título da liga
                        // ═══════════════════════════════════════════════════════════════
                        this.addLog('INFO', 'Procurando título da liga...');
                        let tituloLiga = `LIGA - ${nomeLiga}`;
                        
                        // XPath correto para cada liga baseado no índice da div
                        const xpathTituloLiga = `/html/body/app-root/div/app-robos-novo/app-buscador-padroes/div/div/div/div[2]/div[${i + 1}]/div/span`;
                        this.addLog('INFO', `XPath do título: ${xpathTituloLiga}`);
                        
                        const tituloElement = await this.page.$x(xpathTituloLiga);
                        
                        if (tituloElement.length > 0) {
                            const tituloExtraido = await tituloElement[0].evaluate(el => el.innerText.trim());
                            if (tituloExtraido && tituloExtraido.length > 0) {
                                tituloLiga = tituloExtraido;
                                this.addLog('SUCCESS', `Título extraído: "${tituloLiga}"`);
                            } else {
                                this.addLog('WARN', `Título vazio, usando fallback: "LIGA - ${nomeLiga}"`);
                            }
                        } else {
                            this.addLog('WARN', `Elemento de título não encontrado, usando fallback: "LIGA - ${nomeLiga}"`);
                        }
                        this.addLog('INFO', `Título final da liga: "${tituloLiga}"`);


// ═══════════════════════════════════════════════════════════════════════════════════
// CORREÇÃO 2: Adicionar TRUNCATE TABLE antes dos inserts
// ═══════════════════════════════════════════════════════════════════════════════════
/*
// ANTES DO INSERT, adicionar:
// Executar TRUNCATE TABLE na API antes de inserir os dados
try {
    const truncateUrl = `${this.apiUrl}/api/ResultadosCards/truncate`;
    this.addLog('INFO', `Executando TRUNCATE TABLE: ${truncateUrl}`);
    
    const truncateResponse = await this.page.evaluate(async (url) => {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            return {
                success: response.ok,
                status: response.status,
                statusText: response.statusText
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, truncateUrl);
    
    if (truncateResponse.success) {
        this.addLog('SUCCESS', 'Tabela ResultadosCards truncada com sucesso');
    } else {
        this.addLog('WARN', `Erro ao truncar tabela: ${truncateResponse.status}`);
    }
} catch (error) {
    this.addLog('WARN', `Falha no truncate: ${error.message}`);
}
*/
