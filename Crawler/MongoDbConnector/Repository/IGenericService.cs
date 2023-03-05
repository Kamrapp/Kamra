namespace MongoDbConnector.Repository;

public interface IGenericService<TEntity> where TEntity : BaseEntity
{
    List<TEntity> Get();
    TEntity Get(string key);
    TEntity Create(TEntity entity);
    void Update(string key, TEntity entity);
    void Delete(string key);
}
