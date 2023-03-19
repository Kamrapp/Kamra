using System.ComponentModel.DataAnnotations;

namespace MongoDbConnector.Repository;

public class OfferRepository<TOffer> : BaseRecordRepository<TOffer>, IOfferRepository<TOffer>
    where TOffer : BaseOffer
{
    public OfferRepository(string collectionName)
    : base(collectionName)
    {
    }

    public IEnumerable<TOffer> GetValidOffersAtBegin(TOffer offer) => GetValidOffersAtBegin(offer.ProductKey, offer.ValidFrom);

    public IEnumerable<TOffer> GetValidOffersAtBegin(string productKey, DateOnly validFrom)
    {
        var validOffers = new List<TOffer>();

        validOffers = Records.Find(record => record.ProductKey == productKey &&
            record.ValidFrom <= validFrom && validFrom < record.ValidTo).ToList();

        return validOffers;
    }

    public override TOffer Get(TOffer offerImage) => Get(offerImage.ProductKey, offerImage.ValidFrom, offerImage.ValidTo);
    private TOffer Get(string productKey, DateOnly validFrom, DateOnly validTo) => Records.Find(record => record.ProductKey == productKey && record.ValidFrom == validFrom && record.ValidTo == validTo).FirstOrDefault();

    public override void Update(TOffer updatedItem) => Update(updatedItem.ProductKey, updatedItem.ValidFrom, updatedItem.ValidTo, updatedItem);
    private void Update(string productKey, DateOnly validFrom, DateOnly validTo, TOffer updatedItem)
    {
        updatedItem.UpdatedAt = DateTime.Now;
        Records.ReplaceOne(record => record.ProductKey == productKey && record.ValidFrom == validFrom && record.ValidTo == validTo, updatedItem);
    }

    public override void Delete(TOffer offer) => Delete(offer.ProductKey, offer.ValidFrom, offer.ValidTo);
    private void Delete(string productKey, DateOnly validFrom, DateOnly validTo) => Records.DeleteOne(record => record.ProductKey == productKey && record.ValidFrom == validFrom && record.ValidTo == validTo);
}
