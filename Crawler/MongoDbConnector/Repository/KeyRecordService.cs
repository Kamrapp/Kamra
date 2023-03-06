namespace MongoDbConnector.Repository;

public class KeyRecordService<TKeyRecord> : RecordService<TKeyRecord>, IKeyRecordService<TKeyRecord>
    where TKeyRecord : KeyRecord
{
    public KeyRecordService(string collectionName)
        : base(collectionName)
    {
    }

    public TKeyRecord Get(string key) => Records.Find(record => record.Key == key).FirstOrDefault();

    public virtual void Update(string key, TKeyRecord updatedItem)
    {
        Records.ReplaceOne(record => record.Key == key, updatedItem);
    }

    public void Delete(string key) => Records.DeleteOne(record => record.Key == key);
}
