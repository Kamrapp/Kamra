namespace MongoDbConnector.Repository;

public interface IGenericService<TEntity> where TEntity : class, IDbRecord
{
    List<TEntity> Get();
    TEntity Get(string id);
    TEntity Create(TEntity entity);
    void Update(string id, TEntity entity);
    void Delete(string id);
}
