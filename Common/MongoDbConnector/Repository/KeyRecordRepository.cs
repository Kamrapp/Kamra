using Shared.Records.Base;

namespace MongoDbConnector.Repository;

public class KeyRecordRepository<TKeyRecord> : RecordRepository<TKeyRecord>, IKeyRecordRepository<TKeyRecord>
    where TKeyRecord : KeyRecord
{
    public KeyRecordRepository(string collectionName)
        : base(collectionName)
    {
    }

    public override TKeyRecord Get(TKeyRecord record) => Get(record.Key);
    public TKeyRecord Get(string key) => Records.Find(record => record.Key == key).FirstOrDefault();

    public override void Update(TKeyRecord updatedItem) => Update(updatedItem.Key, updatedItem);
    public virtual void Update(string key, TKeyRecord updatedItem)
    {
        Records.ReplaceOne(record => record.Key == key, updatedItem);
    }

    public override void Delete(TKeyRecord recordToDelete) => Delete(recordToDelete.Key);
    public void Delete(string key) => Records.DeleteOne(record => record.Key == key);





}
