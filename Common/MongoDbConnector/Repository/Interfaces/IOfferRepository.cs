using Shared.Records.Base;

namespace MongoDbConnector.Repository.Interfaces;

public interface IOfferRepository<TOffer> : IBaseRecordRepository<TOffer>
    where TOffer : BaseRecord
{
    public IEnumerable<TOffer> GetValidOffersAtBegin(TOffer offer);
}
