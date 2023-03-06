namespace MongoDbConnector.Repository;

public class ProductService<TProduct> : KeyRecordService<TProduct>
    where TProduct : BaseProduct
{
    public ProductService(IMongoDatabase database, string collectionName)
        : base(database, collectionName)
    {
    }


    public override void Update(string key, TProduct updatedRecord)
    {
        updatedRecord.UpdatedAt = DateTime.UtcNow;
        _records.ReplaceOne(record => record.Key == key, updatedRecord);
    }
}
