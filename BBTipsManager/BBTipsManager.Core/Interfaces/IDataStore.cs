using BBTipsManager.Core.Models;

namespace BBTipsManager.Core.Interfaces;

public interface IDataStore
{
    Task<T?> GetAsync<T>(string key) where T : class;
    Task<bool> SetAsync<T>(string key, T value) where T : class;
    Task<bool> DeleteAsync(string key);
    Task<List<T>> GetAllAsync<T>(string collectionName) where T : class;
    Task<bool> InsertAsync<T>(string collectionName, T item) where T : class;
    Task<bool> UpdateAsync<T>(string collectionName, Guid id, T item) where T : class;
    Task<bool> DeleteFromCollectionAsync(string collectionName, Guid id);
}
