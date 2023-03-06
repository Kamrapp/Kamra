namespace MongoDbConnector.Repository;

public class ProductService<TProduct> : BaseRecordService<TProduct>
    where TProduct : BaseProduct
{
    public ProductService(string collectionName)
        : base(collectionName)
    {
    }
}
