using Shared.Records.Base;

namespace MongoDbConnector.Repository;

public class ProductRepository<TProduct> : BaseRecordRepository<TProduct>
    where TProduct : BaseProduct
{
    public ProductRepository(string collectionName)
        : base(collectionName)
    {
    }
}
