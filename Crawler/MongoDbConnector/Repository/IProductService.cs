namespace MongoDbConnector.Repository;

public interface IKeyRecordService<TKeyRecord> : IRecordService<TKeyRecord>
    where TKeyRecord : KeyRecord
{
    TKeyRecord Get(string key);
    void Update(string key, TKeyRecord record);
    void Delete(string key);
}
