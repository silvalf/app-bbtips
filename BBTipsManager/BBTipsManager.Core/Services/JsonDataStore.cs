using System.Text.Json;
using BBTipsManager.Core.Interfaces;

namespace BBTipsManager.Core.Services;

public class JsonDataStore : IDataStore
{
    private readonly string _basePath;
    private readonly JsonSerializerOptions _jsonOptions;

    public JsonDataStore(string basePath)
    {
        _basePath = basePath;
        Directory.CreateDirectory(_basePath);
        
        _jsonOptions = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    public async Task<T?> GetAsync<T>(string key) where T : class
    {
        var path = GetFilePath(key);
        if (!File.Exists(path))
            return null;

        var json = await File.ReadAllTextAsync(path);
        return JsonSerializer.Deserialize<T>(json, _jsonOptions);
    }

    public async Task<bool> SetAsync<T>(string key, T value) where T : class
    {
        try
        {
            var path = GetFilePath(key);
            var json = JsonSerializer.Serialize(value, _jsonOptions);
            await File.WriteAllTextAsync(path, json);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public Task<bool> DeleteAsync(string key)
    {
        try
        {
            var path = GetFilePath(key);
            if (File.Exists(path))
                File.Delete(path);
            return Task.FromResult(true);
        }
        catch
        {
            return Task.FromResult(false);
        }
    }

    public async Task<List<T>> GetAllAsync<T>(string collectionName) where T : class
    {
        var path = GetCollectionPath(collectionName);
        if (!File.Exists(path))
            return new List<T>();

        var json = await File.ReadAllTextAsync(path);
        return JsonSerializer.Deserialize<List<T>>(json, _jsonOptions) ?? new List<T>();
    }

    public async Task<bool> InsertAsync<T>(string collectionName, T item) where T : class
    {
        try
        {
            var items = await GetAllAsync<T>(collectionName);
            items.Add(item);
            var path = GetCollectionPath(collectionName);
            var json = JsonSerializer.Serialize(items, _jsonOptions);
            await File.WriteAllTextAsync(path, json);
            return true;
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
            var items = await GetAllAsync<T>(collectionName);
            var idProperty = typeof(T).GetProperty("Id");
            if (idProperty == null)
                return false;

            var index = items.FindIndex(x => 
            {
                var value = idProperty.GetValue(x);
                return value != null && ((Guid)value) == id;
            });

            if (index == -1)
                return false;

            items[index] = item;
            var path = GetCollectionPath(collectionName);
            var json = JsonSerializer.Serialize(items, _jsonOptions);
            await File.WriteAllTextAsync(path, json);
            return true;
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
            var items = await GetAllAsync<object>(collectionName);
            var removed = items.RemoveAll(x =>
            {
                var prop = x.GetType().GetProperty("Id");
                if (prop == null) return false;
                var value = prop.GetValue(x);
                return value != null && ((Guid)value) == id;
            });

            if (removed == 0)
                return false;

            var path = GetCollectionPath(collectionName);
            var json = JsonSerializer.Serialize(items, _jsonOptions);
            await File.WriteAllTextAsync(path, json);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private string GetFilePath(string key) => Path.Combine(_basePath, $"{key}.json");
    private string GetCollectionPath(string name) => Path.Combine(_basePath, $"collection_{name}.json");
}
