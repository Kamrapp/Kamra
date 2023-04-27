namespace MongoDbConnector.Repository;

public class BaseRecordRepository<TBaseRecord> : KeyRecordRepository<TBaseRecord>, IBaseRecordRepository<TBaseRecord>
    where TBaseRecord : BaseRecord
{
    public BaseRecordRepository(string collectionName)
        : base(collectionName)
    {
    }

    public override void Update(string key, TBaseRecord updatedItem)
    {
        updatedItem.UpdatedAt = DateTime.Now;
        base.Update(key, updatedItem);
    }

    public override void Update(ObjectId id, TBaseRecord updatedItem)
    {
        updatedItem.UpdatedAt = DateTime.Now;
        base.Update(id, updatedItem);
    }
}
