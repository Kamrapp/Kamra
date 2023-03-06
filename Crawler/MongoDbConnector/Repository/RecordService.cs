using System.Collections;

namespace MongoDbConnector.Repository;

public abstract class RecordService<TRecord> : IRecordService<TRecord> where TRecord : IDbRecord
{
    protected IMongoCollection<TRecord> Records { get; private set; }

    private readonly string CollectionName;

    public RecordService(string collectionName)
    {
        CollectionName = collectionName;
    }

    public void SetConnection(IMongoDatabase database)
    {
        Records = database.GetCollection<TRecord>(CollectionName);
    }

    public List<TRecord> Get() => Records.Find(record => true).ToList();

    public TRecord Get(ObjectId id) => Records.Find(record => record.Id == id).FirstOrDefault();

    public TRecord Create(TRecord record)
    {
        Records.InsertOne(record);
        return record;
    }

    public void Update(ObjectId id, TRecord updatedItem) => Records.ReplaceOne(record => record.Id == id, updatedItem);

    public void Delete(TRecord recordToDelete) => Records.DeleteOne(record => record.Id == recordToDelete.Id);

    public void Delete(ObjectId id) => Records.DeleteOne(record => record.Id == id);
}
