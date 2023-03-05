namespace MongoDbConnector.Repository;

public interface IOfferService<TEntity> : IGenericService<TEntity>
    where TEntity : BaseEntity
{
    TEntity Get(string productKey, DateOnly validFrom, DateOnly? validTo);
    void Update(string productKey, DateOnly validFrom, DateOnly? validTo, TEntity entity);
    void Delete(string productKey, DateOnly validFrom, DateOnly? validTo);
}
