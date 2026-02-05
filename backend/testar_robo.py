"""
Script para testar o robô BB Tips diretamente
"""
import asyncio
import sys
import os

# Adicionar o diretório atual ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from robo_bbtips import BBTipsRobo, RoboConfig

async def main():
    print("=" * 60)
    print("🧪 Teste do Robô BB Tips")
    print("=" * 60)
    
    # Configuração do robô (edite conforme necessário)
    config = RoboConfig(
        credencial_id="1EFF3743-8D41-4CA6-8014-2D0B4CAB3F1A",  # Use o ID da credencial correta
        email="@email",
        senha="@Leo10203040",
        url_base="https://app.bbtips.com.br",
        intervalo_verificacao=30,  # segundos
        estrategias_ativas=["Estratégia 1", "Estratégia 2"],
        modo_debug=True
    )
    
    print(f"\n📧 Email: {config.email}")
    print(f"🌐 URL: {config.url_base}")
    print(f"⏱️ Intervalo: {config.intervalo_verificacao}s")
    print(f"🎯 Estratégias: {config.estrategias_ativas}")
    
    # Criar instância do robô
    robo = BBTipsRobo(config)
    
    # Definir callback para logs
    def log_callback(log):
        print(f"[{log.timestamp}] [{log.level}] {log.message}")
        if log.details:
            print(f"   📋 Detalhes: {log.details}")
    
    robo.set_log_callback(log_callback)
    
    print("\n🚀 Iniciando robô...")
    print("-" * 60)
    
    try:
        await robo.iniciar()
    except KeyboardInterrupt:
        print("\n\n⏹️ Parando robô por Ctrl+C...")
        await robo.parar()
    except Exception as e:
        print(f"\n💥 Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
