using Shared.Records.Base;

namespace MongoDbConnector.Repository.Interfaces;

public interface IBaseRecordRepository<TKeyRecord> : IKeyRecordRepository<TKeyRecord>
    where TKeyRecord : BaseRecord
{
}
