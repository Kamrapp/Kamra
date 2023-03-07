namespace MongoDbConnector.Repository;

public class LinkRepository<TProduct> : KeyRecordRepository<TProduct>
    where TProduct : KeyRecord
{
    public LinkRepository(string collectionName)
        : base(collectionName)
    {
    }
}
