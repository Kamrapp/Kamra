namespace MongoDbConnector.Repository;

public class KeyRecordService<TKeyRecord> : RecordService<TKeyRecord>, IKeyRecordService<TKeyRecord>
    where TKeyRecord : KeyRecord
{
    public KeyRecordService(IMongoDatabase database, string collectionName)
        : base(database, collectionName)
    {
    }

    public TKeyRecord Get(string key) => _records.Find(record => record.Key == key).FirstOrDefault();

    public virtual void Update(string key, TKeyRecord updatedItem)
    {
        _records.ReplaceOne(record => record.Key == key, updatedItem);
    }

    public void Delete(string key) => _records.DeleteOne(record => record.Key == key);
}
