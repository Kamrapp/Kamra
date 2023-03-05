namespace MongoDbConnector.Repository;

public class OfferService<TEntity> : GenericService<TEntity>, IOfferService<TEntity>
    where TEntity : BaseOffer
{
    public OfferService(string collectionName)
    : base(collectionName)
    {
    }

    public TEntity Get(string productKey, DateOnly validFrom, DateOnly? validTo) => _items.Find(item => item.ProductKey == productKey).FirstOrDefault();

    public void Update(string productKey, DateOnly validFrom, DateOnly? validTo, TEntity updatedItem)
    {
        updatedItem.UpdatedAt = DateTime.UtcNow;
        _items.ReplaceOne(item => item.ProductKey == productKey, updatedItem);
    }

    public void Delete(string productKey, DateOnly validFrom, DateOnly? validTo) => _items.DeleteOne(item => item.ProductKey == productKey);
}
