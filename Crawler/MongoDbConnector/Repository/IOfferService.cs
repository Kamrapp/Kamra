namespace MongoDbConnector.Repository;

public interface IOfferService<TEntity> : IGenericService<TEntity>
    where TEntity : BaseEntity
{
    TEntity Get(string productKey, DateTime validFrom, DateTime? validTo);
    void Update(string productKey, DateTime validFrom, DateTime? validTo, TEntity entity);
    void Delete(string productKey, DateTime validFrom, DateTime? validTo);
}
