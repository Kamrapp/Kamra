namespace MongoDbConnector.Repository;

public class OfferService<TOffer> : RecordService<TOffer>, IOfferService<TOffer>
    where TOffer : BaseOffer
{
    public OfferService(string collectionName)
    : base(collectionName)
    {
    }

    public TOffer Get(string productKey, DateOnly validFrom, DateOnly? validTo) => Records.Find(item => item.ProductKey == productKey).FirstOrDefault();

    public void Update(string productKey, DateOnly validFrom, DateOnly? validTo, TOffer updatedItem)
    {
        updatedItem.UpdatedAt = DateTime.UtcNow;
        Records.ReplaceOne(item => item.ProductKey == productKey, updatedItem);
    }

    public void Delete(string productKey, DateOnly validFrom, DateOnly? validTo) => Records.DeleteOne(item => item.ProductKey == productKey);
}
