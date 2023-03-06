namespace MongoDbConnector.Repository;

public interface IOfferService<TOffer> : IBaseRecordService<TOffer>
    where TOffer : BaseRecord
{
    public IEnumerable<TOffer> GetValidOffersAtBegin(string productKey, DateOnly validFrom);
    TOffer Get(string productKey, DateOnly validFrom, DateOnly validTo);
    void Delete(string productKey, DateOnly validFrom, DateOnly validTo);
}
