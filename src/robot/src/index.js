/**
 * BB Tips Robot - Entry Point
 * Robot de automação para BB Tips (Puppeteer)
 */

require('dotenv').config();

const BBTipsRobo = require('./services/robotService');

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

async function main() {
    console.log('═══════════════════════════════════════════');
    console.log('🤖 BB Tips Robot');
    console.log('═══════════════════════════════════════════');
    
    const robo = new BBTipsRobo(config);
    
    try {
        await robo.init();
        
        const loginSuccess = await robo.fazerLogin();
        if (!loginSuccess) {
            console.log('❌ Falha no login');
            await robo.close();
            process.exit(1);
        }
        
        console.log('✅ Login realizado!');
        
        // Executar fluxo do Buscador
        const resultado = await robo.executarBuscadorPadroes(config.buscadorPadroes);
        
        if (resultado.sucesso) {
            console.log('\n✅ SUCESSO!');
            if (resultado.lucros) {
                console.log('\n🏆 MELHORES LUCROS:');
                resultado.lucros.slice(0, 5).forEach((l, i) => {
                    console.log(`  ${i + 1}. ${l.nome}: ${l.valor}`);
                });
            }
        }
        
        await robo.close();
        
    } catch (error) {
        console.error('💥 Erro:', error.message);
        process.exit(1);
    }
}

main();
