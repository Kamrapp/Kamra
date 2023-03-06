namespace MongoDbConnector.Repository;

public class OfferService<TOffer> : RecordService<TOffer>, IOfferService<TOffer>
    where TOffer : BaseOffer
{
    public OfferService(IMongoDatabase database, string collectionName)
    : base(database, collectionName)
    {
    }

    public TOffer Get(string productKey, DateOnly validFrom, DateOnly? validTo) => _records.Find(item => item.ProductKey == productKey).FirstOrDefault();

    public void Update(string productKey, DateOnly validFrom, DateOnly? validTo, TOffer updatedItem)
    {
        updatedItem.UpdatedAt = DateTime.UtcNow;
        _records.ReplaceOne(item => item.ProductKey == productKey, updatedItem);
    }

    public void Delete(string productKey, DateOnly validFrom, DateOnly? validTo) => _records.DeleteOne(item => item.ProductKey == productKey);
}
