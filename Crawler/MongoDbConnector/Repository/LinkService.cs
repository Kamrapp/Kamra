namespace MongoDbConnector.Repository;

public class LinkService<TProduct> : KeyRecordService<TProduct>
    where TProduct : KeyRecord
{
    public LinkService(string collectionName)
        : base(collectionName)
    {
    }
}
