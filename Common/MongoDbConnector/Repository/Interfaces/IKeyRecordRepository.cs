using Shared.Records.Base;

namespace MongoDbConnector.Repository.Interfaces;

public interface IKeyRecordRepository<TKeyRecord> : IRecordRepository<TKeyRecord>
    where TKeyRecord : KeyRecord
{
    TKeyRecord Get(string key);
    void Update(string key, TKeyRecord record);
    void Delete(string key);
}
