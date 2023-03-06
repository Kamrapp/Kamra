namespace MongoDbConnector.Repository;

public class OfferService<TOffer> : BaseRecordService<TOffer>, IOfferService<TOffer>
    where TOffer : BaseOffer
{
    public OfferService(string collectionName)
    : base(collectionName)
    {
    }

    public IEnumerable<TOffer> GetValidOffersAtBegin(string productKey, DateOnly validFrom)
    {
        var validOffers = new List<TOffer>();

        validOffers = Records.Find(record => record.ProductKey == productKey &&
            record.ValidFrom <= validFrom && validFrom < record.ValidTo).ToList();

        return validOffers;
    }

    public TOffer Get(string productKey, DateOnly validFrom, DateOnly validTo) => Records.Find(record => record.ProductKey == productKey && record.ValidFrom == validFrom && record.ValidTo == validTo).FirstOrDefault();

    public override void Update(ObjectId id, TOffer updatedItem)
    {
        updatedItem.UpdatedAt = DateTime.Now;
        Records.ReplaceOne(record => record.ProductKey == updatedItem.ProductKey, updatedItem);
    }

    public void Delete(string productKey, DateOnly validFrom, DateOnly validTo) => Records.DeleteOne(record => record.ProductKey == productKey && record.ValidFrom == validFrom && record.ValidTo == validTo);
}
