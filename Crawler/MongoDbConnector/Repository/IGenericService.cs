namespace MongoDbConnector.Repository;

public interface IGenericService<TEntity> where TEntity : BaseEntity
{
    List<TEntity> Get();
    TEntity Get(ObjectId id);
    TEntity Create(TEntity entity);
    void Update(ObjectId id, TEntity entity);
    void Delete(ObjectId id);
}
