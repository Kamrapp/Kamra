namespace MongoDbConnector.Repository;

public abstract class RecordRepository<TRecord> : IRecordRepository<TRecord> where TRecord : IDbRecord
{
    protected IMongoCollection<TRecord> Records { get; private set; }

    private readonly string CollectionName;

    public RecordRepository(string collectionName)
    {
        CollectionName = collectionName;
    }

    public void SetConnection(IMongoDatabase database)
    {
        Records = database.GetCollection<TRecord>(CollectionName);
    }

    public TRecord Create(TRecord record)
    {
        Records.InsertOne(record);
        return record;
    }

    public List<TRecord> Get() => Records.Find(record => true).ToList();
    public List<TRecord> Get(FilterDefinition<TRecord> filter) => Records.Find(filter).ToList();

    public virtual TRecord Get(TRecord record) => Get(record.Id);
    public virtual TRecord Get(ObjectId id) => Records.Find(record => record.Id == id).FirstOrDefault();

    public virtual void Update(TRecord updatedItem) => Update(updatedItem.Id, updatedItem);
    public virtual void Update(ObjectId id, TRecord updatedItem) => Records.ReplaceOne(record => record.Id == id, updatedItem);

    public virtual void Delete(TRecord recordToDelete) => Delete(recordToDelete.Id);
    public virtual void Delete(ObjectId id) => Records.DeleteOne(record => record.Id == id);
}
