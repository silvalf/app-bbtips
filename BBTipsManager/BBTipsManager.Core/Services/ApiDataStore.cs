using System.Net.Http.Json;
using System.Text.Json;
using BBTipsManager.Core.Interfaces;
using BBTipsManager.Core.Models;

namespace BBTipsManager.Core.Services;

/// <summary>
/// Implementação de IDataStore que consome a API do backend Python com SQL Server
/// </summary>
public class ApiDataStore : IDataStore
{
    private readonly HttpClient _httpClient;
    private readonly JsonSerializerOptions _jsonOptions;

    public ApiDataStore(string baseUrl = "http://localhost:8000/api")
    {
        _httpClient = new HttpClient();
        _httpClient.BaseAddress = new Uri(baseUrl);
        
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };
    }

    public async Task<T?> GetAsync<T>(string key) where T : class
    {
        try
        {
            // Configurações estão em endpoints específicos
            if (typeof(T) == typeof(ConfiguracaoBBTips))
            {
                var response = await _httpClient.GetAsync("/config/bbtips");
                if (response.IsSuccessStatusCode)
                {
                    var config = await response.Content.ReadFromJsonAsync<ConfiguracaoBBTips>(_jsonOptions);
                    return config as T;
                }
                return null;
            }
            
            if (typeof(T) == typeof(ConfiguracaoGeral))
            {
                var response = await _httpClient.GetAsync("/config/geral");
                if (response.IsSuccessStatusCode)
                {
                    var config = await response.Content.ReadFromJsonAsync<ConfiguracaoGeral>(_jsonOptions);
                    return config as T;
                }
                return null;
            }

            return null;
        }
        catch
        {
            return null;
        }
    }

    public async Task<bool> SetAsync<T>(string key, T value) where T : class
    {
        try
        {
            if (value is ConfiguracaoBBTips configBBTips)
            {
                var response = await _httpClient.PutAsJsonAsync("/config/bbtips", new
                {
                    configBBTips.Email,
                    configBBTips.Senha,
                    configBBTips.UrlBase,
                    configBBTips.LembrarCredenciais,
                    configBBTips.AutoLogin,
                    configBBTips.TimeoutSegundos,
                    configBBTips.ModoDebug
                });
                return response.IsSuccessStatusCode;
            }
            
            if (value is ConfiguracaoGeral configGeral)
            {
                var response = await _httpClient.PutAsJsonAsync("/config/geral", new
                {
                    configGeral.NotificacoesAtivas,
                    configGeral.SomAlerta,
                    configGeral.IntervaloAtualizacao,
                    configGeral.TemaAplicacao,
                    configGeral.IniciarComWindows,
                    configGeral.CaminhoBancoDados
                });
                return response.IsSuccessStatusCode;
            }

            return false;
        }
        catch
        {
            return false;
        }
    }

    public Task<bool> DeleteAsync(string key)
    {
        return Task.FromResult(true);
    }

    public async Task<List<T>> GetAllAsync<T>(string collectionName) where T : class
    {
        try
        {
            if (collectionName == "bancas")
            {
                var response = await _httpClient.GetAsync("/bancas");
                if (response.IsSuccessStatusCode)
                {
                    var bancas = await response.Content.ReadFromJsonAsync<List<Banca>>(_jsonOptions);
                    return bancas as List<T> ?? new List<T>();
                }
            }
            
            if (collectionName == "operacoes")
            {
                // Operações são recuperadas por banca
                return new List<T>();
            }

            return new List<T>();
        }
        catch
        {
            return new List<T>();
        }
    }

    public async Task<bool> InsertAsync<T>(string collectionName, T item) where T : class
    {
        try
        {
            if (collectionName == "bancas" && item is Banca banca)
            {
                var response = await _httpClient.PostAsJsonAsync("/bancas", new
                {
                    Nome = banca.Nome,
                    SaldoInicial = banca.SaldoInicial,
                    StopLoss = banca.StopLoss,
                    StopGain = banca.StopGain,
                    StakeBase = banca.StakeBase,
                    Estrategia = (int)banca.Estrategia,
                    Mercado = (int)banca.Mercado,
                    Multiplicador = banca.Multiplicador,
                    MaxGales = banca.MaxGales
                });
                return response.IsSuccessStatusCode;
            }

            return false;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> UpdateAsync<T>(string collectionName, Guid id, T item) where T : class
    {
        try
        {
            if (collectionName == "bancas" && item is Banca banca)
            {
                var response = await _httpClient.PutAsJsonAsync($"/bancas/{id:N}", new
                {
                    Nome = banca.Nome,
                    SaldoInicial = banca.SaldoInicial,
                    SaldoAtual = banca.SaldoAtual,
                    StopLoss = banca.StopLoss,
                    StopGain = banca.StopGain,
                    StakeBase = banca.StakeBase,
                    Estrategia = (int)banca.Estrategia,
                    Status = (int)banca.Status,
                    Mercado = (int)banca.Mercado,
                    Multiplicador = banca.Multiplicador,
                    MaxGales = banca.MaxGales
                });
                return response.IsSuccessStatusCode;
            }

            return false;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> DeleteFromCollectionAsync(string collectionName, Guid id)
    {
        try
        {
            if (collectionName == "bancas")
            {
                var response = await _httpClient.DeleteAsync($"/bancas/{id:N}");
                return response.IsSuccessStatusCode;
            }

            return false;
        }
        catch
        {
            return false;
        }
    }
}
