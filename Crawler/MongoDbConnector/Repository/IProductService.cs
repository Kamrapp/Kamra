namespace MongoDbConnector.Repository;

public interface IProductService<TEntity> : IGenericService<TEntity>
    where TEntity : BaseEntity
{
    TEntity Get(string key);
    void Update(string key, TEntity entity);
    void Delete(string key);
}
