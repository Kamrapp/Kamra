namespace MongoDbConnector.Repository;

public class BaseRecordService<TBaseRecord> : KeyRecordService<TBaseRecord>, IBaseRecordService<TBaseRecord>
    where TBaseRecord : BaseRecord
{
    public BaseRecordService(string collectionName)
        : base(collectionName)
    {
    }

    public override void Update(string key, TBaseRecord updatedItem)
    {
        updatedItem.UpdatedAt = DateTime.Now;
        base.Update(key, updatedItem);
    }
}
