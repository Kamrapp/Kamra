namespace MongoDbConnector.Repository;

public class ProductService<TProduct> : KeyRecordService<TProduct>
    where TProduct : BaseProduct
{
    public ProductService(string collectionName)
        : base(collectionName)
    {
    }


    public override void Update(string key, TProduct updatedRecord)
    {
        updatedRecord.UpdatedAt = DateTime.UtcNow;
        Records.ReplaceOne(record => record.Key == key, updatedRecord);
    }
}
