namespace MongoDbConnector.Repository;

public interface IOfferService<TOffer> : IRecordService<TOffer>
    where TOffer : IDbRecord
{
    TOffer Get(string productKey, DateOnly validFrom, DateOnly? validTo);
    void Update(string productKey, DateOnly validFrom, DateOnly? validTo, TOffer offer);
    void Delete(string productKey, DateOnly validFrom, DateOnly? validTo);
}
